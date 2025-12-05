import React, { useState, useEffect } from 'react';
// Bổ sung đầy đủ icon
import { 
  Truck, Users, BarChart3, Clock, TrendingUp, HandCoins, 
  Receipt, Plus, PackagePlus, ShoppingCart, Wrench, BookCopy,
  UserPlus, LogIn, LogOut, ShieldCheck, Building,
  FilePlus
} from 'lucide-react';

// --- HÀM HỖ TRỢ ---
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0 VNĐ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// --- KHỞI TẠO DỮ LIỆU RỖNG (SẴN SÀNG NHẬP LIỆU) ---
// Dữ liệu này sẽ được lưu vào localStorage để giữ lại khi refresh
const initialData = {
  kpi: [
    { title: 'Tổng Doanh Thu Tháng', value: 0, change: '0%', icon: TrendingUp, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
    { title: 'Lãi Gộp', value: 0, change: '0%', icon: HandCoins, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
    { title: 'Công Nợ Quá Hạn (Khách hàng)', value: 0, change: '0', icon: Clock, color: 'text-red-500', bgColor: 'bg-red-50' },
    { title: 'Giá Trị Tồn Kho', value: 0, change: '0 xe', icon: Truck, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  ],
  inventory: [],
  sales: [],
  customers: [],
  availableTrucks: [],
  salespersons: [],
  suppliers: [],
  spareParts: [],
  journalEntries: []
};

// --- API HELPERS (GIẢ LẬP BACKEND VỚI LOCALSTORAGE) ---
// Hàm này mô phỏng gọi API nhưng thực tế là đọc/ghi vào localStorage
const apiCall = async (endpoint, method = 'GET', body = null, token = null) => {
  // console.log(`API Call: ${method} ${endpoint}`, { body, token });
  await new Promise(resolve => setTimeout(resolve, 300)); // Giả lập độ trễ

  // 1. Đăng nhập
  if (endpoint === '/api/token-auth/' && method === 'POST') {
    if (body.username === 'admin' && body.password === 'admin123') {
      return { token: 'mock-auth-token-1234567890' };
    } else {
      throw new Error('Tài khoản hoặc mật khẩu không đúng.');
    }
  }

  // 2. Yêu cầu xác thực
  if (!token) throw new Error('Chưa xác thực.');

  // Lấy dữ liệu từ localStorage hoặc dùng dữ liệu rỗng ban đầu
  const getDB = () => {
    const db = localStorage.getItem('appData');
    return db ? JSON.parse(db) : initialData;
  };

  const saveDB = (newData) => {
    localStorage.setItem('appData', JSON.stringify(newData));
  };

  const db = getDB();

  // --- XỬ LÝ CÁC ENDPOINT ---

  // GET KPI
  if (endpoint.startsWith('/api/kpi')) {
    // Tính toán lại KPI dựa trên dữ liệu thực tế
    const totalRevenue = db.sales.reduce((sum, item) => sum + item.amount, 0);
    // Giả sử lãi gộp là 10% doanh thu cho đơn giản (hoặc tính từ giá vốn nếu có)
    const grossProfit = totalRevenue * 0.1; 
    const inventoryValue = db.inventory.reduce((sum, item) => sum + (item.cost || 0), 0);
    const inventoryCount = db.inventory.length;

    return [
      { title: 'Tổng Doanh Thu Tháng', value: totalRevenue, change: '+0%', icon: TrendingUp, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
      { title: 'Lãi Gộp', value: grossProfit, change: '+0%', icon: HandCoins, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
      { title: 'Công Nợ Quá Hạn', value: 0, change: '0', icon: Clock, color: 'text-red-500', bgColor: 'bg-red-50' },
      { title: 'Giá Trị Tồn Kho', value: inventoryValue, change: `${inventoryCount} xe`, icon: Truck, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    ];
  }

  // GET/POST Khách Hàng
  if (endpoint === '/api/khachhang/') {
    if (method === 'GET') return db.customers;
    if (method === 'POST') {
      const newCustomer = { id: Date.now(), ...body };
      db.customers.push(newCustomer);
      saveDB(db);
      return newCustomer;
    }
  }

  // GET/POST Nhà Cung Cấp
  if (endpoint === '/api/nhacungcap/') {
    if (method === 'GET') return db.suppliers;
    if (method === 'POST') {
      const newSupplier = { id: Date.now(), ...body };
      db.suppliers.push(newSupplier);
      saveDB(db);
      return newSupplier;
    }
  }

  // GET/POST Nhập Kho (Xe Tải)
  if (endpoint === '/api/xetai/') {
    // Lọc xe tồn kho
    if (method === 'GET') {
        if (endpoint.includes('status=AVAILABLE')) return db.inventory.filter(x => x.status === 'AVAILABLE');
        if (endpoint.includes('status=LONG_STOCK')) return db.inventory.filter(x => x.daysInStock > 60); // Mock logic
        return db.inventory;
    }
    if (method === 'POST') {
      const newTruck = {
        id: body.vin, // VIN làm ID
        model: `${body.make} ${body.model}`,
        cost: parseFloat(body.cost_price),
        status: 'AVAILABLE',
        daysInStock: 0,
        supplier_id: body.supplier_id
      };
      db.inventory.push(newTruck);
      db.availableTrucks.push(newTruck); // Cập nhật danh sách xe sẵn sàng bán

      // Tự động tạo bút toán
      db.journalEntries.push({
        id: `J${Date.now()}`, date: new Date().toISOString(),
        account: 'INVENTORY', description: `Nhập kho xe VIN: ${body.vin}`,
        debit: newTruck.cost, credit: 0,
      });
      db.journalEntries.push({
        id: `J${Date.now()+1}`, date: new Date().toISOString(),
        account: 'ACCOUNTS_PAYABLE', description: `Ghi nợ NCC (Xe VIN: ${body.vin})`,
        debit: 0, credit: newTruck.cost,
      });

      saveDB(db);
      return { success: true };
    }
  }

  // GET/POST Bán Hàng
  if (endpoint.startsWith('/api/donhangban/')) {
    if (method === 'GET') return db.sales;
    if (method === 'POST') {
      // Tìm xe trong kho
      const truckIndex = db.inventory.findIndex(t => t.id === body.car_vin);
      if (truckIndex === -1) throw new Error('Xe không tồn tại.');
      
      const truck = db.inventory[truckIndex];
      if (truck.status !== 'AVAILABLE') throw new Error('Xe đã bán.');

      // Cập nhật trạng thái xe
      db.inventory[truckIndex].status = 'SOLD';
      db.availableTrucks = db.availableTrucks.filter(t => t.id !== body.car_vin);

      const customer = db.customers.find(c => c.id == body.customer_id);
      const salePrice = parseFloat(body.sale_price);

      const newSale = {
        id: Date.now(),
        customer: customer ? customer.name : 'Khách lẻ',
        model: truck.model,
        salesperson: 'Admin',
        amount: salePrice,
        date: new Date().toISOString()
      };
      db.sales.push(newSale);

      // Bút toán bán hàng
      db.journalEntries.push({
        id: `J${Date.now()}`, date: new Date().toISOString(),
        account: 'ACCOUNTS_RECEIVABLE', description: `Bán xe ${truck.model}`,
        debit: salePrice, credit: 0,
      });
      db.journalEntries.push({
        id: `J${Date.now()+1}`, date: new Date().toISOString(),
        account: 'REVENUE', description: `Doanh thu bán xe`,
        debit: 0, credit: salePrice,
      });
      db.journalEntries.push({
        id: `J${Date.now()+2}`, date: new Date().toISOString(),
        account: 'COGS', description: `Giá vốn xe ${truck.model}`,
        debit: truck.cost, credit: 0,
      });
      db.journalEntries.push({
        id: `J${Date.now()+3}`, date: new Date().toISOString(),
        account: 'INVENTORY', description: `Xuất kho xe`,
        debit: 0, credit: truck.cost,
      });

      saveDB(db);
      return { success: true };
    }
  }

  // GET/POST Bút toán
  if (endpoint === '/api/buttoan/') {
    if (method === 'GET') return db.journalEntries;
    if (method === 'POST') {
      const newEntry = {
        id: `J${Date.now()}`,
        date: new Date().toISOString(),
        account: body.loai_tai_khoan,
        description: body.mo_ta,
        debit: body.loai_giao_dich === 'DEBIT' ? parseFloat(body.so_tien) : 0,
        credit: body.loai_giao_dich === 'CREDIT' ? parseFloat(body.so_tien) : 0,
      };
      db.journalEntries.push(newEntry);
      saveDB(db);
      return newEntry;
    }
  }

  // Các API khác (Mua hàng, Dịch vụ) - chỉ lưu log, không xử lý sâu logic phức tạp
  if (method === 'POST') return { success: true };

  return [];
};

// --- STYLES (CSS chung) ---
const commonStyles = {
  formWrapper: "bg-white p-8 rounded-xl shadow-xl border border-gray-100 max-w-3xl mx-auto",
  formTitle: "text-2xl font-bold text-gray-900 flex items-center mb-6 border-b pb-3",
  input: "mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md p-2.5",
  select: "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm",
  label: "block text-sm font-medium text-gray-700",
  requiredLabel: "block text-sm font-medium text-gray-700 required-label",
  primaryButton: "w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition duration-150",
  successMessage: "p-3 mb-4 rounded-lg text-sm bg-green-100 text-green-800",
  errorMessage: "p-3 mb-4 rounded-lg text-sm bg-red-100 text-red-800",
};

// Component Card hiển thị KPI
const KPICard = ({ title, value, change, icon: Icon, color, bgColor }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition duration-300 hover:shadow-xl">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-full ${bgColor}`}>
        <Icon className={`${color} h-6 w-6`} />
      </div>
      <span className={`text-sm font-semibold ${color}`}>{change}</span>
    </div>
    <p className="mt-4 text-3xl font-bold text-gray-900">
      {typeof value === 'number' ? formatCurrency(value) : value}
    </p>
    <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
  </div>
);

// Component Bảng đơn giản
const SimpleTable = ({ title, columns, data, rowRenderer }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-full">
    <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data && data.length > 0 ? (
            data.map(rowRenderer)
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center text-gray-500 py-4">
                Chưa có dữ liệu.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Component Form Cơ Bản ---
const FormBase = ({ title, icon: Icon, iconColor = 'text-blue-600', children, onSubmit, message, isSubmitting, submitText, submitColor = 'bg-blue-600', hoverSubmitColor = 'hover:bg-blue-700' }) => {
  return (
    <div className={`${commonStyles.formWrapper} h-full`}>
      <h2 className={commonStyles.formTitle}>
        <Icon className={`h-6 w-6 mr-3 ${iconColor}`} />
        {title}
      </h2>
      
      {message && (
        <div className={`p-3 mb-4 rounded-lg text-sm ${message.type === 'success' ? commonStyles.successMessage : commonStyles.errorMessage}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {children}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white ${submitColor} ${hoverSubmitColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition duration-150`}
        >
          {isSubmitting ? 'Đang Xử Lý...' : submitText}
        </button>
      </form>
    </div>
  );
};

// --- 0. Component Trang Đăng Nhập ---
const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const data = await apiCall('/api/token-auth/', 'POST', { username, password });
      if (data.token) {
        onLoginSuccess(data.token);
      }
    } catch (err) {
      setError(err.message || 'Lỗi đăng nhập.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-xl border border-gray-200">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 mr-3 text-blue-600" />
            Đăng Nhập Hệ Thống
          </h1>
          <p className="mt-2 text-gray-600">Sử dụng tài khoản được cấp để truy cập.</p>
        </div>
        
        {error && <div className={commonStyles.errorMessage}>{error}</div>}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className={commonStyles.label}>Tên đăng nhập</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={commonStyles.input} placeholder="admin" />
          </div>
          <div>
            <label className={commonStyles.label}>Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={commonStyles.input} placeholder="admin123" />
          </div>
          <button type="submit" disabled={isLoading} className={commonStyles.primaryButton}>
            {isLoading ? 'Đang Đăng Nhập...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- 1. Component Dashboard ---
const DashboardPage = ({ token }) => {
  const [kpiData, setKpiData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const kpi = await apiCall('/api/kpi', 'GET', null, token);
        const sales = await apiCall('/api/donhangban/?limit=5', 'GET', null, token);
        const inventory = await apiCall('/api/xetai/?status=LONG_STOCK', 'GET', null, token); // Sẽ trả về [] nếu chưa có
        
        setKpiData(kpi);
        setSalesData(sales);
        setInventoryData(inventory || []);
      } catch (error) {
        console.error("Lỗi tải Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [token]);

  const salesRowRenderer = (item) => (
    <tr key={item.id}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{item.id}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.customer}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.model}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">{formatCurrency(item.amount)}</td>
    </tr>
  );
  
  if (loading) return <div className="text-center p-10">Đang tải dữ liệu Tổng Quan...</div>;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((item, index) => <KPICard key={index} {...item} />)}
      </div>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SimpleTable title="Đơn Hàng Bán Gần Đây" columns={['ID', 'Khách hàng', 'Model Xe', 'Số tiền']} data={salesData} rowRenderer={salesRowRenderer} />
        </div>
        <div className="lg:col-span-1">
          <SimpleTable title="Xe Tồn Kho" columns={['Model', 'Giá trị']} data={inventoryData} rowRenderer={(item) => <tr><td>{item.model}</td><td>{formatCurrency(item.cost)}</td></tr>} />
        </div>
      </div>
    </>
  );
};

// --- 2. Component Quản lý Khách Hàng ---
const CustomerManagementPage = ({ token, onDataSubmit }) => {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [message, setMessage] = useState(null);

  const fetchCustomers = async () => {
    const data = await apiCall('/api/khachhang/', 'GET', null, token);
    setCustomers(data);
  };
  
  useEffect(() => { fetchCustomers(); }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return setMessage({ type: 'error', text: 'Thiếu tên.' });
    await apiCall('/api/khachhang/', 'POST', formData, token);
    setMessage({ type: 'success', text: `Đã thêm: ${formData.name}` });
    setFormData({ name: '', phone: '', address: '' });
    onDataSubmit();
    fetchCustomers();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SimpleTable title="Danh Sách Khách Hàng" columns={['Tên', 'SĐT', 'Địa Chỉ']} data={customers} 
          rowRenderer={(item) => (
            <tr key={item.id}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{item.phone}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{item.address}</td>
            </tr>
          )} 
        />
      </div>
      <div className="lg:col-span-1">
        <FormBase title="Thêm Khách Hàng" icon={UserPlus} onSubmit={handleSubmit} message={message} submitText="Lưu">
          <input type="text" placeholder="Tên Khách Hàng" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={commonStyles.input} required />
          <input type="text" placeholder="Số Điện Thoại" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={commonStyles.input} required />
          <input type="text" placeholder="Địa Chỉ" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className={commonStyles.input} />
        </FormBase>
      </div>
    </div>
  );
};

// --- 3. Component Nhập Kho ---
const InventoryForm = ({ token, onDataSubmit }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({ vin: '', make: '', model: '', cost_price: '', supplier_id: '' });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    apiCall('/api/nhacungcap/', 'GET', null, token).then(setSuppliers);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await apiCall('/api/xetai/', 'POST', formData, token);
    setMessage({ type: 'success', text: `Đã nhập kho xe VIN: ${formData.vin}` });
    setFormData({ vin: '', make: '', model: '', cost_price: '', supplier_id: '' });
    onDataSubmit();
  };

  return (
    <FormBase title="Nhập Kho Xe Tải" icon={PackagePlus} iconColor="text-emerald-600" onSubmit={handleSubmit} message={message} submitText="Xác Nhận">
      <input type="text" placeholder="Số VIN" value={formData.vin} onChange={e => setFormData({...formData, vin: e.target.value})} className={commonStyles.input} required />
      <select value={formData.supplier_id} onChange={e => setFormData({...formData, supplier_id: e.target.value})} className={commonStyles.select} required>
        <option value="">-- Chọn Nhà Cung Cấp --</option>
        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <input type="text" placeholder="Hãng Xe" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} className={commonStyles.input} />
      <input type="text" placeholder="Model" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className={commonStyles.input} required />
      <input type="number" placeholder="Giá Vốn" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className={commonStyles.input} required />
    </FormBase>
  );
};

// --- 4. Component Bán Hàng ---
const SalesForm = ({ token, onDataSubmit }) => {
  const [availableTrucks, setAvailableTrucks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({ customer_id: '', car_vin: '', sale_price: '' });
  const [message, setMessage] = useState(null);

  const loadData = () => {
    apiCall('/api/xetai/?status=AVAILABLE', 'GET', null, token).then(setAvailableTrucks);
    apiCall('/api/khachhang/', 'GET', null, token).then(setCustomers);
  };

  useEffect(() => { loadData(); }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/api/donhangban/', 'POST', formData, token);
      setMessage({ type: 'success', text: 'Bán hàng thành công!' });
      setFormData({ customer_id: '', car_vin: '', sale_price: '' });
      loadData(); // Reload xe
      onDataSubmit();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <FormBase title="Tạo Đơn Bán Hàng" icon={Receipt} onSubmit={handleSubmit} message={message} submitText="Bán Xe">
      <select value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})} className={commonStyles.select} required>
        <option value="">-- Chọn Khách Hàng --</option>
        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select value={formData.car_vin} onChange={e => setFormData({...formData, car_vin: e.target.value})} className={commonStyles.select} required>
        <option value="">-- Chọn Xe Tải --</option>
        {availableTrucks.map(t => <option key={t.id} value={t.id}>{t.model} ({t.id})</option>)}
      </select>
      <input type="number" placeholder="Giá Bán" value={formData.sale_price} onChange={e => setFormData({...formData, sale_price: e.target.value})} className={commonStyles.input} required />
    </FormBase>
  );
};

// --- 5. Component Nhà Cung Cấp ---
const SupplierManagementPage = ({ token, onDataSubmit }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [message, setMessage] = useState(null);

  const fetchSuppliers = async () => {
    const data = await apiCall('/api/nhacungcap/', 'GET', null, token);
    setSuppliers(data);
  };
  
  useEffect(() => { fetchSuppliers(); }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return setMessage({ type: 'error', text: 'Thiếu tên.' });
    await apiCall('/api/nhacungcap/', 'POST', formData, token);
    setMessage({ type: 'success', text: `Đã thêm NCC: ${formData.name}` });
    setFormData({ name: '', phone: '', address: '' });
    onDataSubmit();
    fetchSuppliers();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SimpleTable title="Danh Sách NCC" columns={['Tên', 'SĐT', 'Địa Chỉ']} data={suppliers} 
          rowRenderer={(item) => (
            <tr key={item.id}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{item.phone}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{item.address}</td>
            </tr>
          )} 
        />
      </div>
      <div className="lg:col-span-1">
        <FormBase title="Thêm Nhà Cung Cấp" icon={Building} iconColor="text-gray-700" onSubmit={handleSubmit} message={message} submitText="Lưu">
          <input type="text" placeholder="Tên NCC" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={commonStyles.input} required />
          <input type="text" placeholder="SĐT" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={commonStyles.input} />
          <input type="text" placeholder="Địa Chỉ" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className={commonStyles.input} />
        </FormBase>
      </div>
    </div>
  );
};

// --- 6. Component Kế Toán ---
const AccountingReportPage = ({ token }) => {
  const [entries, setEntries] = useState([]);
  
  useEffect(() => {
    apiCall('/api/buttoan/', 'GET', null, token).then(data => setEntries(data.reverse()));
  }, [token]);

  return (
    <SimpleTable title="Sổ Cái Kế Toán" columns={['Ngày', 'Tài Khoản', 'Mô Tả', 'Nợ', 'Có']} data={entries} 
      rowRenderer={(item) => (
        <tr key={item.id}>
          <td className="px-6 py-4 text-sm text-gray-500">{formatDate(item.date)}</td>
          <td className="px-6 py-4 text-sm font-semibold text-gray-700">{item.account}</td>
          <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
          <td className="px-6 py-4 text-sm text-emerald-600">{formatCurrency(item.debit)}</td>
          <td className="px-6 py-4 text-sm text-red-600">{formatCurrency(item.credit)}</td>
        </tr>
      )} 
    />
  );
};

// --- APP MAIN ---
const App = () => {
  const [authToken, setAuthToken] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Tải lại state từ localStorage khi F5 để không bị logout
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) setAuthToken(savedToken);
  }, []);

  const handleLogin = (token) => {
    setAuthToken(token);
    localStorage.setItem('authToken', token);
  };

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('authToken');
    setCurrentPage('dashboard');
  };

  // Callback giả để trigger reload data (trong thực tế dùng Context/Redux)
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey(k => k + 1);

  if (!authToken) return <LoginPage onLoginSuccess={handleLogin} />;

  const navButtons = [
    { key: 'dashboard', label: 'Tổng Quan', icon: Users },
    { key: 'customers', label: 'Khách Hàng', icon: UserPlus },
    { key: 'suppliers', label: 'Nhà Cung Cấp', icon: Building },
    { key: 'inventory', label: 'Nhập Kho', icon: PackagePlus },
    { key: 'sales', label: 'Bán Hàng', icon: Plus },
    { key: 'accounting', label: 'Kế Toán', icon: BookCopy },
  ];

  const renderContent = () => {
    const props = { token: authToken, onDataSubmit: triggerRefresh, key: refreshKey };
    switch (currentPage) {
      case 'dashboard': return <DashboardPage {...props} />;
      case 'customers': return <CustomerManagementPage {...props} />;
      case 'suppliers': return <SupplierManagementPage {...props} />;
      case 'inventory': return <InventoryForm {...props} onInventorySubmit={triggerRefresh} />;
      case 'sales': return <SalesForm {...props} onSalesSubmit={triggerRefresh} />;
      case 'accounting': return <AccountingReportPage {...props} />;
      default: return <div className="text-center p-10">Chọn một mục để bắt đầu.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-full mx-auto py-3 px-4 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-blue-600" /> Quản Trị Xe Tải
          </h1>
          <nav className="flex flex-wrap justify-center space-x-1">
            {navButtons.map(nav => (
              <button key={nav.key} onClick={() => setCurrentPage(nav.key)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${currentPage === nav.key ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                <nav.icon className="h-4 w-4 mr-1.5" /> {nav.label}
              </button>
            ))}
            <button onClick={handleLogout} className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4 mr-1.5" /> Thoát
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;