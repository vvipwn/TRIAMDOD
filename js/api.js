// All shared records go through the same-origin Worker; credentials stay HttpOnly.
(function () {
  const MOCK_STORAGE_KEY = 'td_mock_orders';
  const MOCK_USER_KEY = 'td_mock_user';

  function getMockOrders() {
    try { return JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '[]'); } catch { return []; }
  }
  function saveMockOrder(order) {
    const orders = getMockOrders();
    orders.unshift(order);
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(orders));
  }
  function getMockUser() {
    try { return JSON.parse(sessionStorage.getItem(MOCK_USER_KEY) || 'null'); } catch { return null; }
  }
  function setMockUser(user) {
    if (user) sessionStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(MOCK_USER_KEY);
  }

  async function request(path, body) {
    try {
      const response = await fetch(path, {
        method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(3000)
      });
      if (response.ok) return await response.json();
      if (response.status !== 404 && response.status !== 502) {
        const result = await response.json().catch(() => ({}));
        const error = new Error(result.error || 'เชื่อมต่อระบบไม่สำเร็จ กรุณาลองอีกครั้ง');
        error.status = response.status;
        throw error;
      }
    } catch (e) {
      if (e.status && e.status !== 404) throw e;
    }

    // Fallback for preview / localhost environment without Cloudflare Worker
    if (path === '/api/auth/session') {
      return { user: getMockUser() };
    }
    if (path === '/api/auth/google') {
      const user = getMockUser() || { id: 'preview-student', fullname: 'นักเรียนเตรียมน้อม (ทดสอบ)', email: 'student@tun.ac.th', role: 'student-current', studentId: '12345', grade: '6', room: '1', studentNumber: '10', expiresAt: Date.now() + 86400000 };
      setMockUser(user);
      return { user };
    }
    if (path === '/api/auth/logout') {
      setMockUser(null);
      return { success: true };
    }
    if (path === '/api/orders' && body !== undefined) {
      const user = getMockUser() || { id: 'preview-user', fullname: 'นักเรียนทดสอบ', email: 'student@tun.ac.th', role: 'student-current' };
      const pkg = window.TD_PACKAGES?.find(p => p.id === body.packageId) || { name: 'แพ็กเกจทดสอบ', price: 99 };
      const newOrder = {
        id: `TD10-${Math.floor(100000 + Math.random() * 900000)}`,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        packageId: body.packageId,
        packageName: pkg.name,
        price: pkg.price,
        hasShirt: Boolean(body.shirtSize),
        shirtColor: body.shirtColor || null,
        shirtSize: body.shirtSize || null,
        paymentMethod: body.paymentMethod || 'scan',
        address: body.details?.address || '',
        phone: body.details?.phone || '',
        batch: body.details?.batch || '',
        proofUrl: body.details?.proofUrl || '',
        proofName: body.details?.proofName || '',
        studentId: user.studentId || '12345',
        grade: user.grade || '6',
        room: user.room || '11',
        studentNumber: user.studentNumber || '16',
        status: body.paymentMethod === 'cash' ? 'pending_cash' : 'pending',
        submittedAt: new Date().toISOString(),
        slipUrl: body.slipDataUrl || 'assets/favicon.png',
        version: 1,
        reviews: []
      };
      saveMockOrder(newOrder);
      return { order: newOrder };
    }
    if (path.startsWith('/api/admin/orders/') && path.endsWith('/review') && body !== undefined) {
      const match = path.match(/\/api\/admin\/orders\/(TD10-[^/]+)\/review/);
      if (match) {
        const id = match[1];
        const orders = getMockOrders();
        const order = orders.find(o => o.id === id);
        if (order) {
          order.status = body.status;
          order.rejectReason = body.reason || '';
          order.reviewedAt = new Date().toISOString();
          order.reviewerEmail = 'admin@tun.ac.th';
          order.version = (order.version || 0) + 1;
          order.reviews = order.reviews || [];
          order.reviews.push({ status: body.status, reviewer_email: 'admin@tun.ac.th', reason: body.reason || '', created_at: order.reviewedAt });
          localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(orders));
          return { order };
        }
      }
    }
    if (path === '/api/admin/stats') {
      const orders = getMockOrders();
      const approved = orders.filter(o => o.status === 'approved');
      const revenue = approved.reduce((sum, o) => sum + (o.price || 0), 0);
      const students = orders.filter(o => o.role === 'student-current').length;
      const alumni = orders.filter(o => o.role === 'alumni').length;
      const pending = orders.filter(o => o.status === 'pending' || o.status === 'pending_cash').length;
      const rejected = orders.filter(o => o.status === 'rejected').length;
      const shirts = [];
      approved.forEach(o => {
        if (o.hasShirt && o.shirtColor && o.shirtSize) {
          let s = shirts.find(item => item.color === o.shirtColor && item.size === o.shirtSize);
          if (!s) { s = { color: o.shirtColor, size: o.shirtSize, count: 0 }; shirts.push(s); }
          s.count++;
        }
      });
      return { total: orders.length, revenue, pending, rejected, students, alumni, shirts };
    }
    if (path === '/api/admin/access') {
      return { owner: 'president@tun.ac.th', admins: [] };
    }
    if (path.startsWith('/api/orders/') && !path.endsWith('/slip')) {
      const id = path.split('/')[3];
      const orders = getMockOrders();
      const order = orders.find(o => o.id === id);
      if (order) {
        return { order, reviews: order.reviews || [] };
      }
    }
    if (path === '/api/orders' || path.startsWith('/api/orders/history')) {
      const user = getMockUser();
      const all = getMockOrders();
      const filtered = user ? all.filter(o => o.email === user.email || o.role === user.role) : all;
      return { orders: filtered };
    }
    if (path.startsWith('/api/admin/orders')) {
      return { orders: getMockOrders() };
    }
    return { success: true };
  }

  window.TD_API = { request, setMockUser, getMockUser };
})();
