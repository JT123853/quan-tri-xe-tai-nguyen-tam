import React, { useState, useEffect } from 'react';
// Bổ sung icon cho Đăng nhập (LogIn), Đăng xuất (LogOut) và Nhà Cung Cấp (Building)
import { 
  Truck, Users, BarChart3, Clock, TrendingUp, HandCoins, 
  Receipt, Plus, PackagePlus, ShoppingCart, Wrench, BookCopy,
  UserPlus, LogIn, LogOut, ShieldCheck, Building, // Thêm icon Building
  FilePlus // Thêm icon cho bút toán mới
} from 'lucide-react';

// --- HÀM HỖ TRỢ ---
// Hàm định dạng tiền tệ
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0 VNĐ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Hàm định dạng ngày
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};


// --- API HELPERS (GIẢ LẬP BACKEND) ---
const apiCall = async (endpoint, method = 'GET', body = null, token = null) => {
  console.log(`API Call (Giả lập): ${method} ${endpoint}`, { body, token });
  
  // Giả lập độ trễ mạng
  await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 500));
  
  // --- MOCK API ROUTER ---
  // 1. Đăng nhập
  if (endpoint === '/api/token-auth/' && method === 'POST') {
    if (body.username === 'admin' && body.password === 'admin123') {
      return { token: 'mock-auth-token-1234567890' };
    } else {
      throw new Error('Tài khoản hoặc mật khẩu không đúng.');
    }
  }

  // 2. Yêu cầu xác thực (Tất cả API khác cần token)
  if (!token) {
    throw new Error('Chưa xác thực. Vui lòng đăng nhập.');
  }

  // 3. Routes (Mock data)
  if (endpoint.startsWith('/api/kpi')) {
    return [
      { title: 'Tổng Doanh Thu Tháng', value: 12500000000, change: '+12.5%', icon: TrendingUp, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
      { title: 'Lãi Gộp', value: 1850000000, change: '+8.2%', icon: HandCoins, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
      { title: 'Công Nợ Quá Hạn (Khách hàng)', value: 3, change: '-2', icon: Clock, color: 'text-red-500', bgColor: 'bg-red-50' },
      { title: 'Giá Trị Tồn Kho', value: 55000000000, change: '42 xe', icon: Truck, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    ];
  }
  
  // API Khách Hàng
  if (endpoint === '/api/khachhang/' && method === 'GET') {
     return mockApiData.customers; // Sử dụng mockApiData
  }
  if (endpoint === '/api/khachhang/' && method === 'POST') {
    const newCustomer = { id: Math.floor(Math.random() * 1000) + 10, ...body };
    mockApiData.customers.push(newCustomer); // Cập nhật mock data
    return newCustomer;
  }
  
  // API Nhà Cung Cấp
  if (endpoint === '/api/nhacungcap/' && method === 'GET') {
     return mockApiData.suppliers; // Sử dụng mockApiData
  }
  if (endpoint === '/api/nhacungcap/' && method === 'POST') {
    const newSupplier = { id: Math.floor(Math.random() * 1000) + 10, ...body };
    mockApiData.suppliers.push(newSupplier); // Cập nhật mock data
    return newSupplier;
  }
  
  // API Kế Toán (Bút toán)
  if (endpoint === '/api/buttoan/' && method === 'GET') {
     return mockApiData.journalEntries;
  }
  if (endpoint === '/api/buttoan/' && method === 'POST') {
    // Backend đã cho phép POST, chúng ta giả lập nó ở đây
    const newEntry = { 
      id: `J${Math.floor(Math.random() * 1000) + 100}`, 
      date: new Date().toISOString(),
      debit: body.loai_giao_dich === 'DEBIT' ? body.so_tien : 0,
      credit: body.loai_giao_dich === 'CREDIT' ? body.so_tien : 0,
      account: body.loai_tai_khoan, // Thêm
      description: body.mo_ta, // Thêm
    };
    mockApiData.journalEntries.push(newEntry); // Thêm vào mock data
    return newEntry;
  }

  // API Nhập Kho (Tạo Xe)
  if (endpoint === '/api/xetai/' && method === 'POST') {
    // Giả lập logic Kịch bản 1 (Nhập kho)
    const newTruck = {
      id: body.vin,
      model: `${body.make} ${body.model}`,
      cost: parseFloat(body.cost_price),
      status: 'AVAILABLE'
    };
    mockApiData.availableTrucks.push(newTruck);
    
    // Tự động tạo bút toán Kế toán (Nợ Kho / Có Phải trả)
    const entry1 = {
      id: `J${Math.floor(Math.random() * 1000) + 100}`, 
      date: new Date().toISOString(),
      account: 'INVENTORY',
      description: `Nhập kho xe VIN: ${body.vin}`,
      debit: newTruck.cost,
      credit: 0,
    };
    const entry2 = {
      id: `J${Math.floor(Math.random() * 1000) + 100}`, 
      date: new Date().toISOString(),
      account: 'ACCOUNTS_PAYABLE',
      description: `Ghi nợ NCC (Xe VIN: ${body.vin})`,
      debit: 0,
      credit: newTruck.cost,
    };
    mockApiData.journalEntries.push(entry1, entry2);
    return { success: true, ...newTruck };
  }
  
  // API Bán Hàng (Tạo Đơn Hàng Bán)
  if (endpoint === '/api/donhangban/' && method === 'POST') {
    // Giả lập logic Kịch bản 2 (Bán hàng)
    const truck = mockApiData.availableTrucks.find(t => t.id === body.car_vin);
    if (!truck) throw new Error('Xe không tồn tại hoặc đã bán.');
    
    const salePrice = parseFloat(body.sale_price);
    const costPrice = truck.cost;
    
    // Cập nhật trạng thái xe
    truck.status = 'SOLD';
    mockApiData.availableTrucks = mockApiData.availableTrucks.filter(t => t.id !== body.car_vin);
    
    const customer = mockApiData.customers.find(c => c.id == body.customer_id);
    const newSale = {
      id: Math.floor(Math.random() * 1000) + 1000,
      customer: customer ? customer.name : 'Khách hàng',
      model: truck.model,
      salesperson: 'admin (tự động)',
      amount: salePrice,
      date: new Date().toISOString()
    };
    mockApiData.sales.push(newSale);
    
    // Tự động tạo 4 bút toán Kế toán (Doanh thu, Giá vốn)
    // 1. Ghi nhận Doanh thu
    mockApiData.journalEntries.push({
      id: `J${Math.floor(Math.random() * 1000) + 100}`, date: new Date().toISOString(),
      account: 'ACCOUNTS_RECEIVABLE', description: `Bán xe ${truck.model} (ĐH ${newSale.id})`,
      debit: salePrice, credit: 0,
    });
    mockApiData.journalEntries.push({
      id: `J${Math.floor(Math.random() * 1000) + 100}`, date: new Date().toISOString(),
      account: 'REVENUE', description: `Doanh thu ĐH ${newSale.id}`,
      debit: 0, credit: salePrice,
    });
    // 2. Ghi nhận Giá vốn
    mockApiData.journalEntries.push({
      id: `J${Math.floor(Math.random() * 1000) + 100}`, date: new Date().toISOString(),
      account: 'COGS', description: `Giá vốn ĐH ${newSale.id}`,
      debit: costPrice, credit: 0,
    });
    mockApiData.journalEntries.push({
      id: `J${Math.floor(Math.random() * 1000) + 100}`, date: new Date().toISOString(),
      account: 'INVENTORY', description: `Xuất kho xe ${truck.model}`,
      debit: 0, credit: costPrice,
    });
    
    return { success: true, ...newSale };
  }
  
  // Mặc định cho các API POST/PUT thành công (Mua hàng, Dịch vụ)
  if (method === 'POST' || method === 'PUT') {
     return { success: true, ...body };
  }

  // Mặc định cho các API GET (trả về mảng rỗng nếu không khớp)
  return [];
};

// --- MOCK DATA (CSDL Giả lập cho UAT) ---
const mockApiData = {
  kpi: [], // Sẽ được tải bởi apiCall
  inventory: [
    { model: 'Peterbilt 579', daysInStock: 120, price: 4100000000, status: 'LONG_STOCK' },
    { model: 'Freightliner Cascadia', daysInStock: 90, price: 2900000000, status: 'LONG_STOCK' },
  ],
  sales: [
    { id: 1001, customer: 'Công ty Vận tải X (cũ)', model: 'Volvo FH16 (cũ)', salesperson: 'Nguyễn Văn A', amount: 3795000000, date: '2025-11-10' },
  ],
  customers: [
    { id: 1, name: 'Công ty Vận tải X (cũ)', phone: '0912345678', address: '123 Đường A, Q1, TP.HCM' },
    { id: 2, name: 'Tập đoàn Logistics Y (cũ)', phone: '0987654321', address: '456 Đường B, Hà Nội' },
  ],
  availableTrucks: [
    { id: 'VIN_OLD_001', model: 'Peterbilt 579 (Tồn)', cost: 4100000000, status: 'AVAILABLE' },
    { id: 'VIN_OLD_002', model: 'Freightliner Cascadia (Tồn)', cost: 2900000000, status: 'AVAILABLE' },
  ],
  suppliers: [
    { id: 1, name: 'Nhà Cung Cấp A (Volvo cũ)', phone: '02838111222', address: 'KCN Sóng Thần, Bình Dương' },
    { id: 'NNC_TEST_HINO', name: 'NCC Xe Tải Hino Việt Nam', phone: '0909090909', address: 'Quận 7' }, // Sẵn cho UAT
  ],
  spareParts: [
    { id: 'PART_OIL_FILTER', name: 'Lọc Nhớt (Chính hãng)', stock: 150 },
    { id: 'PART_AIR_FILTER', name: 'Lọc Gió Động Cơ', stock: 80 },
    { id: 'PART_BRAKE_PAD', name: 'Má Phanh (Bộ)', stock: 45 },
  ],
  journalEntries: [
    { id: 'J_OLD_001', date: '2025-11-01', account: 'EXPENSE', debit: 15000000, credit: 0, description: 'Chi phí mặt bằng T10/2025' },
    { id: 'J_OLD_002', date: '2025-11-01', account: 'CASH', debit: 0, credit: 15000000, description: 'TT Chi phí mặt bằng T10' },
  ]
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
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-full"> {/* Thêm h-full */}
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
                Không có dữ liệu.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// --- Component Form Cơ Bản (Refactored) ---
const FormBase = ({ title, icon: Icon, iconColor = 'text-blue-600', children, onSubmit, message, isSubmitting, submitText, submitColor = 'bg-blue-600', hoverSubmitColor = 'hover:bg-blue-700' }) => {
  return (
    <div className={`${commonStyles.formWrapper} h-full`}> {/* Thêm h-full */}
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
      // Gọi API đăng nhập (mocked)
      const data = await apiCall('/api/token-auth/', 'POST', { username, password });
      if (data.token) {
        onLoginSuccess(data.token); // Gửi token về App
      }
    } catch (err) {
      setError(err.message || 'Lỗi đăng nhập. Vui lòng thử lại.');
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
        
        {error && (
          <div className={commonStyles.errorMessage}>{error}</div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className={commonStyles.label}>Tên đăng nhập</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={commonStyles.input}
              placeholder="admin"
            />
          </div>
          <div>
            <label htmlFor="password" className={commonStyles.label}>Mật khẩu</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={commonStyles.input}
              placeholder="admin123"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition duration-150"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <LogIn className="h-5 w-5 mr-2" />
            )}
            {isLoading ? 'Đang Đăng Nhập...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};


// --- 1. Component Dashboard ---
const DashboardPage = ({ data, token }) => {
  const [kpiData, setKpiData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Gọi API
        const kpi = await apiCall('/api/kpi', 'GET', null, token);
        
        // Sử dụng mock data cho các bảng
        setKpiData(kpi);
        setSalesData(mockApiData.sales); 
        setInventoryData(mockApiData.inventory);

      } catch (error) {
        console.error("Lỗi tải Dashboard data:", error);
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
  const longStockRowRenderer = (item) => (
    <tr key={item.model} className="bg-red-50 hover:bg-red-100">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-800">{item.model}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{formatCurrency(item.price)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-800">{item.daysInStock} ngày</td>
    </tr>
  );
  
  if (loading) return <div className="text-center p-10">Đang tải dữ liệu Tổng Quan...</div>;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((item, index) => (
          <KPICard key={index} {...item} />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SimpleTable
            title="Đơn Hàng Bán Gần Đây (Sales)"
            columns={['ID', 'Khách hàng', 'Model Xe', 'Số tiền']}
            data={salesData.slice(0, 5)}
            rowRenderer={salesRowRenderer}
          />
        </div>
        <div className="lg:col-span-1">
          <SimpleTable
            title="Xe Tồn Kho Cần Xử Lý (Tồn > 60 ngày)"
            columns={['Model', 'Giá trị', 'Ngày tồn']}
            data={inventoryData.filter(i => i.daysInStock > 60)}
            rowRenderer={longStockRowRenderer}
          />
        </div>
      </div>
    </>
  );
};


// --- 2. Component Quản lý Khách Hàng (List + Form) ---
const CustomerManagementPage = ({ token, onDataSubmit }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tải danh sách khách hàng
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/api/khachhang/', 'GET', null, token);
      setCustomers(data);
    } catch (error) {
      setMessage({ type: 'error', text: `Lỗi tải danh sách khách hàng: ${error.message}` });
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setMessage({ type: 'error', text: 'Vui lòng điền Tên và Số điện thoại.' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      // POST /api/khachhang/
      await apiCall('/api/khachhang/', 'POST', formData, token);
      setMessage({ type: 'success', text: `Tạo khách hàng ${formData.name} thành công.` });
      setFormData({ name: '', phone: '', address: '' });
      onDataSubmit(); // Tải lại dữ liệu (giả lập)
      fetchCustomers(); // Tải lại danh sách
    } catch (error) {
       setMessage({ type: 'error', text: `Lỗi: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerRowRenderer = (item) => (
    <tr key={item.id}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.phone}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.address}</td>
    </tr>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {loading ? (
          <div className="text-center p-10">Đang tải danh sách khách hàng...</div>
        ) : (
          <SimpleTable
            title="Danh Sách Khách Hàng"
            columns={['Tên Khách Hàng', 'Số Điện Thoại', 'Địa Chỉ']}
            data={customers}
            rowRenderer={customerRowRenderer}
          />
        )}
      </div>
      <div className="lg:col-span-1">
        <FormBase
          title="Tạo Khách Hàng Mới"
          icon={UserPlus}
          iconColor="text-indigo-600"
          onSubmit={handleSubmit}
          message={message}
          isSubmitting={isSubmitting}
          submitText="Lưu Khách Hàng"
          submitColor="bg-indigo-600"
          hoverSubmitColor="hover:bg-indigo-700"
        >
          <div>
            <label htmlFor="name" className={commonStyles.requiredLabel}>Tên Khách Hàng</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={commonStyles.input} placeholder="VD: Công ty Vận Tải Sài Gòn"/>
          </div>
          <div>
            <label htmlFor="phone" className={commonStyles.requiredLabel}>Số Điện Thoại</label>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className={commonStyles.input} />
          </div>
          <div>
            <label htmlFor="address" className={commonStyles.label}>Địa Chỉ</label>
            <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} className={commonStyles.input} />
          </div>
        </FormBase>
      </div>
    </div>
  );
};


// --- 3. Component Form Nhập Kho ---
const InventoryForm = ({ token, onInventorySubmit }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({ vin: '', make: '', model: '', year: new Date().getFullYear(), color: '', cost_price: '', supplier_id: '' });
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Tải danh sách NCC 
    apiCall('/api/nhacungcap/', 'GET', null, token).then(setSuppliers);
  }, [token]);
  
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vin || !formData.model || !formData.cost_price || !formData.supplier_id) {
      setMessage({ type: 'error', text: 'Vui lòng điền VIN, Model, Giá Vốn và Nhà Cung Cấp.' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      // POST /api/xetai/ (API này sẽ tự động tạo bút toán)
      await apiCall('/api/xetai/', 'POST', formData, token);
      setMessage({ type: 'success', text: `Nhập kho xe (VIN: ${formData.vin}) thành công! Tồn kho và bút toán Công nợ Phải trả đã được cập nhật.` });
      setFormData({ vin: '', make: '', model: '', year: new Date().getFullYear(), color: '', cost_price: '', supplier_id: '' });
      onInventorySubmit(); // Trigger tải lại dữ liệu (nếu cần)
    } catch (error) {
       setMessage({ type: 'error', text: `Lỗi: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormBase
      title="Tạo Hồ Sơ Xe Tải (Nhập Kho)"
      icon={PackagePlus}
      iconColor="text-emerald-600"
      onSubmit={handleSubmit}
      message={message}
      isSubmitting={isSubmitting}
      submitText="Xác Nhận Nhập Kho"
      submitColor="bg-emerald-600"
      hoverSubmitColor="hover:bg-emerald-700"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="vin" className={commonStyles.requiredLabel}>Số VIN (Số Khung)</label>
          <input type="text" id="vin" name="vin" value={formData.vin} onChange={handleChange} required className={commonStyles.input} placeholder="VD: TEST_VIN_001"/>
        </div>
        <div>
          <label htmlFor="supplier_id" className={commonStyles.requiredLabel}>Nhà Cung Cấp</label>
          <select id="supplier_id" name="supplier_id" value={formData.supplier_id} onChange={handleChange} required className={commonStyles.select}>
            <option value="">-- Chọn Nhà Cung Cấp --</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="make" className={commonStyles.label}>Hãng Xe</label>
          <input type="text" id="make" name="make" value={formData.make} onChange={handleChange} className={commonStyles.input} placeholder="VD: Hino"/>
        </div>
        <div>
          <label htmlFor="model" className={commonStyles.requiredLabel}>Model Xe</label>
          <input type="text" id="model" name="model" value={formData.model} onChange={handleChange} required className={commonStyles.input} placeholder="VD: 500"/>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="year" className={commonStyles.label}>Năm Sản Xuất</label>
          <input type="number" id="year" name="year" value={formData.year} onChange={handleChange} className={commonStyles.input} />
        </div>
        <div>
          <label htmlFor="color" className={commonStyles.label}>Màu Sắc</label>
          <input type="text" id="color" name="color" value={formData.color} onChange={handleChange} className={commonStyles.input} placeholder="VD: Trắng" />
        </div>
      </div>
      <div>
        <label htmlFor="cost_price" className={commonStyles.requiredLabel}>Giá Vốn (VNĐ)</label>
        <input type="number" id="cost_price" name="cost_price" value={formData.cost_price} onChange={handleChange} required className={commonStyles.input} placeholder="VD: 1500000000"/>
      </div>
    </FormBase>
  );
};


// --- 4. Component Form Bán Hàng ---
const SalesForm = ({ token, onSalesSubmit }) => {
  const [availableTrucks, setAvailableTrucks] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  const [formData, setFormData] = useState({ customer_id: '', car_vin: '', sale_price: '' });
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Tải dữ liệu cần thiết cho form (luôn tải lại để lấy xe mới)
    apiCall('/api/khachhang/', 'GET', null, token).then(setCustomers);
    
    // Tải danh sách xe từ mock data
    setAvailableTrucks(mockApiData.availableTrucks.filter(t => t.status === 'AVAILABLE'));
    
  }, [token]);
  
  // Hàm này được gọi khi submit
  const reloadTrucks = () => {
     setAvailableTrucks(mockApiData.availableTrucks.filter(t => t.status === 'AVAILABLE'));
  }

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.car_vin || !formData.sale_price) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      // POST /api/donhangban/ (API này sẽ tự động tạo bút toán)
      await apiCall('/api/donhangban/', 'POST', formData, token);
      setMessage({ type: 'success', text: 'Tạo Đơn Hàng Bán thành công! Hệ thống đã tự động cập nhật tồn kho và bút toán kế toán.' });
      setFormData({ customer_id: '', car_vin: '', sale_price: '' });
      reloadTrucks(); // Tải lại danh sách xe
      onSalesSubmit();
    } catch (error) {
       setMessage({ type: 'error', text: `Lỗi: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormBase
      title="Tạo Đơn Hàng Bán Xe Tải Mới"
      icon={Receipt}
      onSubmit={handleSubmit}
      message={message}
      isSubmitting={isSubmitting}
      submitText="Xác Nhận Đơn Hàng Bán"
    >
      <div>
        <label htmlFor="customer_id" className={commonStyles.requiredLabel}>Khách Hàng</label>
        <select id="customer_id" name="customer_id" value={formData.customer_id} onChange={handleChange} required className={commonStyles.select}>
          <option value="">-- Chọn Khách Hàng --</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="car_vin" className={commonStyles.requiredLabel}>Xe Tải (VIN)</label>
        <select id="car_vin" name="car_vin" value={formData.car_vin} onChange={handleChange} required className={commonStyles.select}>
          <option value="">-- Chọn Xe Tải Còn Tồn --</option>
          {availableTrucks.map(t => <option key={t.id} value={t.id}>{`${t.model} (VIN: ${t.id})`}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="sale_price" className={commonStyles.requiredLabel}>Giá Bán (VNĐ)</label>
        <input type="number" id="sale_price" name="sale_price" value={formData.sale_price} onChange={handleChange} required className={commonStyles.input} placeholder="VD: 1700000000"/>
      </div>
    </FormBase>
  );
};


// --- 5. Component Form Đơn Hàng Mua (Purchasing) ---
const PurchaseOrderForm = ({ token, onDataSubmit }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({ supplier_id: '', expected_delivery_date: '', item_description: '', total_amount: '' });
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Tải danh sách NCC 
    apiCall('/api/nhacungcap/', 'GET', null, token).then(setSuppliers);
  }, [token]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier_id || !formData.item_description || !formData.total_amount) {
      setMessage({ type: 'error', text: 'Vui lòng điền Nhà Cung Cấp, Mô tả và Tổng tiền.' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      // POST /api/donhangmua/
      await apiCall('/api/donhangmua/', 'POST', formData, token);
      setMessage({ type: 'success', text: 'Tạo Đơn Hàng Mua (PO) thành công.' });
      setFormData({ supplier_id: '', expected_delivery_date: '', item_description: '', total_amount: '' });
      onDataSubmit();
    } catch (error) {
       setMessage({ type: 'error', text: `Lỗi: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormBase
      title="Tạo Đơn Hàng Mua (PO)"
      icon={ShoppingCart}
      iconColor="text-purple-600"
      onSubmit={handleSubmit}
      message={message}
      isSubmitting={isSubmitting}
      submitText="Gửi Đơn Hàng Mua"
      submitColor="bg-purple-600"
      hoverSubmitColor="hover:bg-purple-700"
    >
      <div>
        <label htmlFor="supplier_id" className={commonStyles.requiredLabel}>Nhà Cung Cấp</label>
        <select id="supplier_id" name="supplier_id" value={formData.supplier_id} onChange={handleChange} required className={commonStyles.select}>
          <option value="">-- Chọn Nhà Cung Cấp --</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="item_description" className={commonStyles.requiredLabel}>Mô Tả Hàng Hóa</label>
        <input type="text" id="item_description" name="item_description" value={formData.item_description} onChange={handleChange} required className={commonStyles.input} placeholder="VD: 01 xe Hino 500"/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="total_amount" className={commonStyles.requiredLabel}>Tổng Tiền (VNĐ)</label>
          <input type="number" id="total_amount" name="total_amount" value={formData.total_amount} onChange={handleChange} required className={commonStyles.input} placeholder="VD: 1500000000"/>
        </div>
        <div>
          <label htmlFor="expected_delivery_date" className={commonStyles.label}>Ngày Giao Hàng Dự Kiến</label>
          <input type="date" id="expected_delivery_date" name="expected_delivery_date" value={formData.expected_delivery_date} onChange={handleChange} className={commonStyles.input} />
        </div>
      </div>
    </FormBase>
  );
};


// --- 6. Component Form Dịch Vụ Hậu Mãi ---
const ServiceTicketForm = ({ token, onDataSubmit }) => {
  const [allTrucks, setAllTrucks] = useState([]); // Bao gồm cả xe đã bán
  const [spareParts, setSpareParts] = useState([]);
  const [formData, setFormData] = useState({ car_vin: '', service_type: 'MAINTENANCE', description: '', part_id: '', part_quantity: 1, labor_cost: '' });
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Tải dữ liệu (mock)
    // Giả lập tải tất cả xe (cả tồn kho và đã bán)
    const soldTrucks = mockApiData.sales.map(s => ({ id: `VIN_SOLD_${s.id}`, model: `${s.model} (Đã bán)`, status: 'SOLD' }));
    setAllTrucks([...mockApiData.availableTrucks, ...soldTrucks]);
    setSpareParts(mockApiData.spareParts);
  }, [token]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.car_vin || !formData.description) {
      setMessage({ type: 'error', text: 'Vui lòng chọn Xe (VIN) và nhập Mô tả Dịch vụ.' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      // POST /api/phieudichvu/
      await apiCall('/api/phieudichvu/', 'POST', formData, token);
      setMessage({ type: 'success', text: `Tạo Phiếu Dịch Vụ cho xe ${formData.car_vin} thành công.` });
      setFormData({ car_vin: '', service_type: 'MAINTENANCE', description: '', part_id: '', part_quantity: 1, labor_cost: '' });
      onDataSubmit();
    } catch (error) {
       setMessage({ type: 'error', text: `Lỗi: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormBase
      title="Tạo Phiếu Dịch Vụ / Bảo Dưỡng"
      icon={Wrench}
      iconColor="text-orange-600"
      onSubmit={handleSubmit}
      message={message}
      isSubmitting={isSubmitting}
      submitText="Hoàn Thành Phiếu Dịch Vụ"
      submitColor="bg-orange-600"
      hoverSubmitColor="hover:bg-orange-700"
    >
      <div>
        <label htmlFor="car_vin" className={commonStyles.requiredLabel}>Xe Tải (VIN)</label>
        <select id="car_vin" name="car_vin" value={formData.car_vin} onChange={handleChange} required className={commonStyles.select}>
          <option value="">-- Chọn Xe Tải (Cả xe đã bán) --</option>
          {allTrucks.map(t => <option key={t.id} value={t.id}>{`${t.model} (VIN: ${t.id})`}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="service_type" className={commonStyles.label}>Loại Dịch Vụ</label>
        <select id="service_type" name="service_type" value={formData.service_type} onChange={handleChange} className={commonStyles.select}>
          <option value="MAINTENANCE">Bảo Dưỡng Định Kỳ</option>
          <option value="REPAIR">Sửa Chữa</option>
          <option value="WARRANTY">Bảo Hành</option>
        </select>
      </div>
      <div>
        <label htmlFor="description" className={commonStyles.requiredLabel}>Mô Tả Công Việc</label>
        <textarea id="description" name="description" value={formData.description} onChange={handleChange} required rows="3" className={commonStyles.input} placeholder="VD: Bảo dưỡng 1000km đầu tiên..."></textarea>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="part_id" className={commonStyles.label}>Vật Tư / Phụ Tùng</label>
          <select id="part_id" name="part_id" value={formData.part_id} onChange={handleChange} className={commonStyles.select}>
            <option value="">-- Không Dùng Phụ Tùng --</option>
            {spareParts.map(p => <option key={p.id} value={p.id}>{`${p.name} (Tồn: ${p.stock})`}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="part_quantity" className={commonStyles.label}>Số Lượng</label>
          <input type="number" id="part_quantity" name="part_quantity" value={formData.part_quantity} onChange={handleChange} className={commonStyles.input} />
        </div>
      </div>
      <div>
        <label htmlFor="labor_cost" className={commonStyles.label}>Chi Phí Nhân Công (VNĐ)</label>
        <input type="number" id="labor_cost" name="labor_cost" value={formData.labor_cost} onChange={handleChange} className={commonStyles.input} placeholder="VD: 500000" />
      </div>
    </FormBase>
  );
};


// --- 7. Component Báo Cáo Kế Toán (Thêm Form) ---
const AccountingReportPage = ({ token, onDataSubmit }) => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ 
    loai_tai_khoan: 'EXPENSE', 
    loai_giao_dich: 'DEBIT', 
    so_tien: '', 
    mo_ta: '' 
  });
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Danh sách tài khoản (từ Backend Model)
  const accountTypes = [
    'INVENTORY', 'REVENUE', 'COGS', 'CASH', 
    'ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE', 
    'EXPENSE', 'WARRANTY_PROVISION'
  ];

  // Tải danh sách bút toán
  const fetchJournalEntries = async () => {
    setLoading(true);
    try {
      // Luôn gọi API để lấy dữ liệu mới nhất (đã bao gồm các bút toán tự động)
      const data = await apiCall('/api/buttoan/', 'GET', null, token);
      // Sắp xếp mới nhất lên đầu
      setJournalEntries(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      setMessage({ type: 'error', text: `Lỗi tải sổ cái: ${error.message}` });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJournalEntries();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.loai_tai_khoan || !formData.loai_giao_dich || !formData.so_tien || !formData.mo_ta) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin.' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      // POST /api/buttoan/
      await apiCall('/api/buttoan/', 'POST', formData, token);
      setMessage({ type: 'success', text: `Ghi nhận bút toán "${formData.mo_ta}" thành công.` });
      setFormData({ loai_tai_khoan: 'EXPENSE', loai_giao_dich: 'DEBIT', so_tien: '', mo_ta: '' });
      onDataSubmit(); // Callback
      fetchJournalEntries(); // Tải lại danh sách
    } catch (error) {
       setMessage({ type: 'error', text: `Lỗi: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const entryRowRenderer = (item) => (
    <tr key={item.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.date)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{item.account || item.loai_tai_khoan}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.description || item.mo_ta}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">{formatCurrency(item.debit || 0)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{formatCurrency(item.credit || 0)}</td>
    </tr>
  );
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <FormBase
          title="Nhập Bút toán Thủ công"
          icon={FilePlus}
          iconColor="text-gray-700"
          onSubmit={handleSubmit}
          message={message}
          isSubmitting={isSubmitting}
          submitText="Ghi Sổ Bút Toán"
          submitColor="bg-gray-800"
          hoverSubmitColor="hover:bg-gray-900"
        >
          <div>
            <label htmlFor="mo_ta" className={commonStyles.requiredLabel}>Mô Tả</label>
            <input type="text" id="mo_ta" name="mo_ta" value={formData.mo_ta} onChange={handleChange} required className={commonStyles.input} placeholder="VD: Chi phí điện nước T11/2025"/>
          </div>
          <div>
            <label htmlFor="loai_tai_khoan" className={commonStyles.requiredLabel}>Tài Khoản</label>
            <select id="loai_tai_khoan" name="loai_tai_khoan" value={formData.loai_tai_khoan} onChange={handleChange} required className={commonStyles.select}>
              {accountTypes.map(acc => <option key={acc} value={acc}>{acc}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="loai_giao_dich" className={commonStyles.requiredLabel}>Loại Giao Dịch</label>
              <select id="loai_giao_dich" name="loai_giao_dich" value={formData.loai_giao_dich} onChange={handleChange} required className={commonStyles.select}>
                <option value="DEBIT">Nợ (DEBIT)</option>
                <option value="CREDIT">Có (CREDIT)</option>
              </select>
            </div>
            <div>
              <label htmlFor="so_tien" className={commonStyles.requiredLabel}>Số Tiền (VNĐ)</label>
              <input type="number" id="so_tien" name="so_tien" value={formData.so_tien} onChange={handleChange} required className={commonStyles.input} placeholder="5000000"/>
            </div>
          </div>
        </FormBase>
      </div>
      <div className="lg:col-span-2">
        {loading ? (
          <div className="text-center p-10">Đang tải dữ liệu Sổ Cái...</div>
        ) : (
          <SimpleTable
            title="Sổ Cái Kế Toán (Journal Entries)"
            columns={['ID', 'Ngày', 'Tài Khoản', 'Mô Tả', 'Nợ (Debit)', 'Có (Credit)']}
            data={journalEntries}
            rowRenderer={entryRowRenderer}
          />
        )}
      </div>
    </div>
  );
};


// --- 8. Component Quản lý Nhà Cung Cấp ---
const SupplierManagementPage = ({ token, onDataSubmit }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tải danh sách NCC
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/api/nhacungcap/', 'GET', null, token);
      setSuppliers(data);
    } catch (error) {
      setMessage({ type: 'error', text: `Lỗi tải danh sách NCC: ${error.message}` });
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchSuppliers();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setMessage({ type: 'error', text: 'Vui lòng điền Tên Nhà Cung Cấp.' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      // POST /api/nhacungcap/
      await apiCall('/api/nhacungcap/', 'POST', formData, token);
      setMessage({ type: 'success', text: `Tạo NCC ${formData.name} thành công.` });
      setFormData({ name: '', phone: '', address: '' });
      onDataSubmit(); // Tải lại dữ liệu (giả lập)
      fetchSuppliers(); // Tải lại danh sách
    } catch (error) {
       setMessage({ type: 'error', text: `Lỗi: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const supplierRowRenderer = (item) => (
    <tr key={item.id}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.phone}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.address}</td>
    </tr>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {loading ? (
          <div className="text-center p-10">Đang tải danh sách Nhà Cung Cấp...</div>
        ) : (
          <SimpleTable
            title="Danh Sách Nhà Cung Cấp"
            columns={['Tên NCC', 'Số Điện Thoại', 'Địa Chỉ']}
            data={suppliers}
            rowRenderer={supplierRowRenderer}
          />
        )}
      </div>
      <div className="lg:col-span-1">
        <FormBase
          title="Tạo Nhà Cung Cấp Mới"
          icon={Building}
          iconColor="text-gray-700"
          onSubmit={handleSubmit}
          message={message}
          isSubmitting={isSubmitting}
          submitText="Lưu Nhà Cung Cấp"
          submitColor="bg-gray-800"
          hoverSubmitColor="hover:bg-gray-900"
        >
          <div>
            <label htmlFor="name" className={commonStyles.requiredLabel}>Tên Nhà Cung Cấp</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={commonStyles.input} placeholder="VD: NCC Xe Tải Hino Việt Nam"/>
          </div>
          <div>
            <label htmlFor="phone" className={commonStyles.label}>Số Điện Thoại</label>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={commonStyles.input} />
          </div>
          <div>
            <label htmlFor="address" className={commonStyles.label}>Địa Chỉ</label>
            {/* SỬA LỖI: value={handleChange} đã được sửa thành value={formData.address} */}
            <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} className={commonStyles.input} />
          </div>
        </FormBase>
      </div>
    </div>
  );
};


// --- Hàm Chính App ---
const App = () => {
  const [authToken, setAuthToken] = useState(null); 
  const [currentPage, setCurrentPage] = useState('dashboard'); 
  const [username, setUsername] = useState('admin'); // Giả lập user đã đăng nhập
  
  // Xử lý khi đăng nhập thành công
  const handleLoginSuccess = (token) => {
    setAuthToken(token);
    setUsername('admin'); // Lưu tên user
  };
  
  // Xử lý đăng xuất
  const handleLogout = () => {
    setAuthToken(null);
    setCurrentPage('dashboard'); 
  };
  
  // Hàm này được trigger khi có 1 form submit thành công, 
  // để các component khác có thể tải lại dữ liệu nếu cần
  const handleDataRefresh = () => {
    // Trong React thực tế, chúng ta sẽ dùng Context hoặc Redux
    // Ở đây, chúng ta chỉ cần re-render
    console.log("Trigger Data Refresh");
    // Ví dụ: tải lại trang kế toán nếu đang ở đó
    if (currentPage === 'accounting') {
       setCurrentPage(''); // Trick để re-render
       setTimeout(() => setCurrentPage('accounting'), 0);
    }
  };

  // Nếu chưa đăng nhập, hiển thị trang Login
  if (!authToken) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Nếu đã đăng nhập, hiển thị Dashboard
  const renderContent = () => {
    // Truyền token và hàm refresh xuống tất cả các trang con
    const props = {
      token: authToken,
      onDataSubmit: handleDataRefresh, // Truyền hàm refresh
      onInventorySubmit: handleDataRefresh,
      onSalesSubmit: handleDataRefresh
    };
    
    switch(currentPage) {
      case 'dashboard':
        return <DashboardPage token={authToken} />;
      case 'customers':
        return <CustomerManagementPage {...props} />;
      case 'suppliers':
        return <SupplierManagementPage {...props} />;
      case 'inventory':
        return <InventoryForm {...props} />;
      case 'sales':
        return <SalesForm {...props} />;
      case 'purchasing':
        return <PurchaseOrderForm {...props} />;
      case 'service':
        return <ServiceTicketForm {...props} />;
      case 'accounting':
        return <AccountingReportPage {...props} />;
      default:
        return <p className="text-center text-red-500">Trang không tồn tại.</p>;
    }
  };
  
  const navButtons = [
    { key: 'dashboard', label: 'Tổng Quan', icon: Users },
    { key: 'customers', label: 'Khách Hàng', icon: UserPlus },
    { key: 'suppliers', label: 'Nhà Cung Cấp', icon: Building },
    { key: 'purchasing', label: 'Mua Hàng', icon: ShoppingCart },
    { key: 'inventory', label: 'Nhập Kho', icon: PackagePlus },
    { key: 'sales', label: 'Bán Hàng', icon: Plus },
    { key: 'service', label: 'Dịch Vụ', icon: Wrench },
    { key: 'accounting', label: 'Kế Toán', icon: BookCopy },
  ];
  
  const getNavButtonColors = (key) => {
    switch(key) {
      case 'inventory': return 'bg-emerald-600 text-white shadow-lg';
      case 'purchasing': return 'bg-purple-600 text-white shadow-lg';
      case 'service': return 'bg-orange-600 text-white shadow-lg';
      case 'customers': return 'bg-indigo-600 text-white shadow-lg';
      case 'suppliers': return 'bg-gray-700 text-white shadow-lg';
      case 'accounting': return 'bg-gray-800 text-white shadow-lg';
      default: return 'bg-blue-600 text-white shadow-lg';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-full mx-auto py-3 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center mb-2 sm:mb-0">
              <BarChart3 className="h-6 w-6 mr-3 text-blue-600" />
              Hệ Thống Quản Trị Xe Tải (UAT v1.0)
            </h1>
            <nav className="flex flex-wrap justify-center items-center space-x-1 sm:space-x-2">
              {navButtons.map(nav => (
                <button 
                  key={nav.key}
                  onClick={() => setCurrentPage(nav.key)}
                  className={`flex items-center px-3 py-2 rounded-lg font-medium transition duration-150 text-sm ${
                    currentPage === nav.key 
                      ? getNavButtonColors(nav.key)
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <nav.icon className="h-4 w-4 mr-1.5" />
                  {nav.label}
                </button>
              ))}
              {/* Nút Đăng Xuất */}
              <button 
                onClick={handleLogout}
                className="flex items-center px-3 py-2 rounded-lg font-medium transition duration-150 text-sm text-red-600 hover:bg-red-50"
                title={`Đăng xuất khỏi tài khoản ${username}`}
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Đăng Xuất
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto py-8 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
      
      <style>{`
        .required-label::after {
          content: ' *';
          color: red;
        }
      `}</style>
    </div>
  );
};

export default App;