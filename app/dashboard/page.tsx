<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DAKTOP360 REALTORS · sleek dashboard</title>
  <!-- Font & icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    body {
      background: #f5f7fc;
      display: flex;
      min-height: 100vh;
      color: #0b1a33;
    }

    /* ----- SIDEBAR (sleek, dark) ----- */
    .sidebar {
      width: 280px;
      background: #0d1b2a;
      color: #d6e2f0;
      padding: 2rem 1.5rem;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.04);
      transition: all 0.2s;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: white;
      padding-bottom: 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      margin-bottom: 2rem;
    }

    .sidebar-brand i {
      font-size: 1.8rem;
      color: #7b9cf5;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .sidebar-nav a {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      padding: 0.7rem 1rem;
      border-radius: 12px;
      font-weight: 500;
      font-size: 0.95rem;
      color: #b3c9e6;
      text-decoration: none;
      transition: 0.15s;
    }

    .sidebar-nav a i {
      width: 1.4rem;
      font-size: 1.1rem;
      color: #6a86b0;
      transition: 0.15s;
    }

    .sidebar-nav a:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }

    .sidebar-nav a:hover i {
      color: #a3c0ff;
    }

    .sidebar-nav a.active {
      background: rgba(94, 133, 255, 0.15);
      color: white;
      box-shadow: inset 3px 0 0 #5e85ff;
    }

    .sidebar-nav a.active i {
      color: #7b9cf5;
    }

    .sidebar-footer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 0.85rem;
      color: #7a94b9;
    }

    .sidebar-footer .user-badge {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: rgba(255,255,255,0.04);
      padding: 0.6rem 1rem;
      border-radius: 40px;
      margin-bottom: 0.8rem;
    }

    .sidebar-footer .user-badge i {
      font-size: 1.2rem;
      color: #7b9cf5;
    }

    /* ----- MAIN CONTENT (clean, airy) ----- */
    .main {
      flex: 1;
      padding: 2rem 2.5rem 3rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    /* header row */
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .top-header h1 {
      font-size: 1.9rem;
      font-weight: 600;
      letter-spacing: -0.5px;
      color: #0b1a33;
    }

    .top-header h1 span {
      background: #eef3fe;
      padding: 0.2rem 1rem;
      border-radius: 40px;
      font-size: 0.85rem;
      font-weight: 500;
      color: #1c4f8f;
      margin-left: 0.8rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 1.2rem;
    }

    .header-actions .notif-icon {
      background: white;
      padding: 0.6rem 0.9rem;
      border-radius: 40px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
      color: #1f3a5f;
      border: 1px solid #e9eef6;
      font-size: 1.1rem;
      position: relative;
    }

    .header-actions .notif-icon .dot {
      width: 10px;
      height: 10px;
      background: #e85c5c;
      border-radius: 50%;
      position: absolute;
      top: 6px;
      right: 6px;
      border: 2px solid white;
    }

    .header-actions .avatar {
      background: #1f3a5f;
      color: white;
      width: 42px;
      height: 42px;
      border-radius: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1rem;
    }

    /* welcome card */
    .welcome-card {
      background: white;
      border-radius: 28px;
      padding: 1.8rem 2.2rem;
      margin-bottom: 2rem;
      box-shadow: 0 8px 28px rgba(0, 20, 40, 0.03);
      border: 1px solid #f0f4fe;
    }

    .welcome-card h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #0b1a33;
    }

    .welcome-card p {
      color: #4c6889;
      margin-top: 0.3rem;
    }

    /* stats grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .stat-card {
      background: white;
      border-radius: 24px;
      padding: 1.5rem 1.2rem;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.01);
      border: 1px solid #edf2fa;
      transition: 0.1s ease;
    }

    .stat-card .stat-num {
      font-size: 2.2rem;
      font-weight: 700;
      color: #0b1a33;
    }

    .stat-card .stat-label {
      color: #657e9f;
      font-weight: 500;
      font-size: 0.9rem;
      margin-top: 0.2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-card .stat-label a {
      color: #2a5f9e;
      font-weight: 500;
      font-size: 0.8rem;
      text-decoration: none;
    }

    .stat-card .stat-icon {
      color: #5e85ff;
      opacity: 0.4;
      font-size: 1.8rem;
      margin-bottom: 0.3rem;
    }

    /* property & enquiry cards */
    .section-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #0b1a33;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .property-card {
      background: white;
      border-radius: 24px;
      padding: 1.5rem 1.8rem;
      margin-bottom: 1.2rem;
      border: 1px solid #eaf0f8;
      box-shadow: 0 4px 12px rgba(0,0,0,0.01);
      transition: 0.1s;
    }

    .property-card .top-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
    }

    .property-card .tag {
      background: #e3edfc;
      color: #1d4a7c;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.2rem 0.9rem;
      border-radius: 30px;
      letter-spacing: 0.3px;
    }

    .property-card .tag.verified {
      background: #d2f0d9;
      color: #156b38;
    }

    .property-card h3 {
      font-weight: 600;
      font-size: 1.1rem;
      margin: 0.3rem 0 0.1rem;
    }

    .property-card .location {
      color: #52708f;
      font-size: 0.9rem;
    }

    .property-card .price {
      font-weight: 700;
      font-size: 1.3rem;
      color: #0b1a33;
    }

    .property-card .details {
      display: flex;
      flex-wrap: wrap;
      gap: 1.2rem;
      margin-top: 0.6rem;
      font-size: 0.9rem;
      color: #3f5b7a;
    }

    .property-card .details i {
      margin-right: 0.2rem;
      color: #7f9bc2;
    }

    .enquiry-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 0.9rem 1.5rem;
      border-radius: 18px;
      margin-bottom: 0.7rem;
      border: 1px solid #edf2fa;
    }

    .enquiry-item .badge-new {
      background: #e85c5c;
      color: white;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 0.15rem 0.8rem;
      border-radius: 30px;
      margin-left: 0.8rem;
    }

    .summary-box {
      background: #f0f6ff;
      border-radius: 24px;
      padding: 1.5rem 2rem;
      display: flex;
      flex-wrap: wrap;
      gap: 2.5rem;
      margin: 1.5rem 0 1rem;
      border: 1px solid #e1ebfa;
    }

    .summary-box .item {
      display: flex;
      flex-direction: column;
    }

    .summary-box .item .label {
      font-size: 0.8rem;
      color: #4a6b8f;
    }

    .summary-box .item .value {
      font-weight: 600;
      font-size: 1rem;
      color: #0b1a33;
    }

    .quick-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin: 1.8rem 0 1rem;
    }

    .quick-actions .btn {
      background: white;
      border: 1px solid #dde6f2;
      padding: 0.7rem 1.5rem;
      border-radius: 40px;
      font-weight: 500;
      color: #1f3a5f;
      text-decoration: none;
      font-size: 0.9rem;
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      transition: 0.1s;
      box-shadow: 0 2px 6px rgba(0,0,0,0.01);
    }

    .quick-actions .btn i {
      color: #5e85ff;
    }

    .quick-actions .btn:hover {
      background: #f0f6ff;
      border-color: #b7cef0;
    }

    hr {
      border: none;
      border-top: 1px solid #e3eaf3;
      margin: 2rem 0 0.5rem;
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
        height: auto;
        position: relative;
        padding: 1.2rem;
      }
      body {
        flex-direction: column;
      }
      .main {
        padding: 1.5rem;
      }
    }
  </style>
</head>
<body>
  <!-- sidebar -->
  <aside class="sidebar">
    <div class="sidebar-brand">
      <i class="fas fa-building"></i> 
      <span>DAKTOP360</span>
      <span style="font-weight: 300; font-size: 0.8rem; color: #8aa4c9;">REALTORS</span>
    </div>
    <nav class="sidebar-nav">
      <a href="#" class="active"><i class="fas fa-th-large"></i> Dashboard</a>
      <a href="#"><i class="fas fa-user-circle"></i> My Profile</a>
      <a href="#"><i class="fas fa-home"></i> My Properties</a>
      <a href="#"><i class="fas fa-question-circle"></i> Enquiries</a>
      <a href="#"><i class="fas fa-bookmark"></i> Saved Properties</a>
      <a href="#"><i class="fas fa-shopping-cart"></i> My Purchases</a>
      <a href="#"><i class="fas fa-check-circle"></i> Title Verification</a>
      <a href="#"><i class="fas fa-credit-card"></i> Payments</a>
      <a href="#"><i class="fas fa-envelope"></i> Messages</a>
      <a href="#"><i class="fas fa-file-alt"></i> Documents</a>
    </nav>
    <div class="sidebar-footer">
      <div class="user-badge">
        <i class="fas fa-user-shield"></i>
        <span>David Kitili · <span style="color:#8bb0f0;">Admin</span></span>
      </div>
      <div style="display: flex; gap: 0.6rem;">
        <span style="background: #1d3557; padding: 0.2rem 0.8rem; border-radius: 40px; font-size: 0.7rem;">Verified</span>
        <span><i class="fas fa-sign-out-alt" style="color:#6a86b0;"></i> Sign out</span>
      </div>
    </div>
  </aside>

  <!-- main content -->
  <main class="main">
    <!-- header -->
    <div class="top-header">
      <h1>Dashboard <span>Owner</span></h1>
      <div class="header-actions">
        <div class="notif-icon">
          <i class="fas fa-bell"></i>
          <span class="dot"></span>
        </div>
        <div class="avatar">DK</div>
      </div>
    </div>

    <!-- welcome -->
    <div class="welcome-card">
      <h2>Welcome back, David Kitili 🎉</h2>
      <p>Here's what's happening with your account today.</p>
    </div>

    <!-- stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-home"></i></div>
        <div class="stat-num">3</div>
        <div class="stat-label">My Properties <a href="#">View all →</a></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-comment-dots"></i></div>
        <div class="stat-num">5</div>
        <div class="stat-label">Enquiries <a href="#">View all →</a></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-eye"></i></div>
        <div class="stat-num">152</div>
        <div class="stat-label">Profile Views <a href="#">View all →</a></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><i class="fas fa-envelope"></i></div>
        <div class="stat-num">2</div>
        <div class="stat-label">Messages <a href="#">View all →</a></div>
      </div>
    </div>

    <!-- My Properties card -->
    <div class="section-title">
      <span>My Properties</span>
      <a href="#" style="font-weight: 500; font-size: 0.9rem; color:#2a5f9e;">View all →</a>
    </div>
    <div class="property-card">
      <div class="top-row">
        <div>
          <span class="tag verified"><i class="fas fa-check-circle" style="margin-right: 4px;"></i> VERIFIED</span>
          <h3>6 Bedroom Mansion – Kitengela</h3>
          <div class="location"><i class="fas fa-map-pin"></i> Kitengela, Kajiado County</div>
        </div>
        <div class="price">KSh 29,000,000</div>
      </div>
      <div style="display: flex; gap: 0.7rem; flex-wrap: wrap; margin: 0.5rem 0 0.2rem;">
        <span class="tag" style="background:#d9e3f5;">For Sale</span>
        <span style="color:#3f5b7a; font-size:0.9rem;">6 Beds · 6 Baths · 0.25 Acre</span>
        <span style="color:#3f5b7a; font-size:0.85rem; margin-left: auto;">Listed: 2nd August 2025</span>
      </div>
      <div style="margin-top: 0.6rem; display: flex; justify-content: space-between; align-items: center;">
        <span class="tag" style="background:#e5edf9; color:#1f4a7a;">Status: Approved</span>
        <span style="color:#4c6889; font-size:0.85rem;"><i class="far fa-file-alt"></i> documents</span>
      </div>
    </div>

    <!-- recent enquiries -->
    <div class="section-title" style="margin-top: 1.8rem;">
      <span>Recent Enquiries</span>
      <a href="#" style="font-weight: 500; font-size: 0.9rem; color:#2a5f9e;">View all →</a>
    </div>
    <div class="enquiry-item">
      <div><strong>John Mwangi</strong> · Interested in 6 Bedroom Mansion – Kitengela</div>
      <span class="badge-new">New</span>
    </div>
    <div class="enquiry-item">
      <div><strong>Grace Wanjiku</strong> · Interested in 10 Acres – Kimalat, Kitengela</div>
      <span class="badge-new">New</span>
    </div>

    <!-- account summary + quick actions -->
    <div class="summary-box">
      <div class="item">
        <span class="label">Account Type</span>
        <span class="value">Verified User</span>
      </div>
      <div class="item">
        <span class="label">Member Since</span>
        <span class="value">15th May 2025</span>
      </div>
    </div>

    <div class="quick-actions">
      <a href="#" class="btn"><i class="fas fa-plus-circle"></i> List Property</a>
      <a href="#" class="btn"><i class="fas fa-check-double"></i> Verify Title</a>
      <a href="#" class="btn"><i class="fas fa-calculator"></i> Book Valuation</a>
      <a href="#" class="btn"><i class="fas fa-headset"></i> Contact Support</a>
    </div>

    <hr>
    <div style="display: flex; justify-content: flex-end; font-size: 0.8rem; color: #6d89b0; padding-top: 0.5rem;">
      <i class="fas fa-circle" style="color: #71b37f; font-size: 0.5rem; margin-right: 6px;"></i> All systems online
    </div>
  </main>
</body>
</html>