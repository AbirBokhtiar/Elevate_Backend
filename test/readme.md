# Elevate REST API

This project is a **NestJS-based REST API** for the Elevate e-commerce platform, featuring AI-powered customer support, product recommendations, order management, payment integration, and more.

---

## 🚀 Features

### 1. **AI Customer Support (Gemini Integration)**
- **Jarvis AI Agent**: Multi-purpose customer support agent powered by Google Gemini.
  - **Intent Detection**: Classifies user queries (refund, product info, order creation, chat, order tracking, context add).
  - **Contextual Responses**: Answers refund and product questions using real-time product data and refund policy.
  - **Order Tracking**: Extracts order IDs from queries and fetches order status.
  - **Fallback Handling**: Asks for clarification if the intent is unclear.

### 2. **Product Recommendation Tools**
- **AI Enhanced Search**: Suggests relevant products from your catalog based on user queries.
- **Suggest Similar Products**: Recommends similar products from your catalog, using Gemini for semantic matching.

### 3. **Order Management**
- **Create Order**: Allows customers to create orders by providing product, quantity, customer info, and address.
- **Order Lookup**: Fetches order details by ID for tracking and support.

### 4. **Payment Integration**
- **Stripe**: Creates payment intents for orders.
- **SSLCommerz**: (Example code included) Initiates payments via SSLCommerz.

### 5. **WooCommerce Integration**
- **Product Fetching**: Retrieves product lists and details from WooCommerce.
- **Order Fetching**: Retrieves order details for support and tracking.

### 6. **Authentication & User Management**
- **JWT-based Auth**: Secure login, registration, and token refresh.
- **Google OAuth**: Social login via Google.
- **Password Reset**: Email and phone-based password reset flows.
- **Role-based Access Control**: Admin/user roles for protected endpoints.

### 7. **Activity Logging**
- **User & Admin Actions**: Logs key activities for auditing and analytics.
- **CSV Export**: Export activity logs for reporting.

### 8. **Reviews**
- **Product Reviews**: Users can add, update, and delete reviews.
- **Review Moderation**: Admins can approve or reject reviews.

### 9. **Subscription & Payment**
- **Stripe Subscriptions**: Handles multiple subscription plans and payment events.

---

## 🛠️ Tech Stack

- **NestJS** (TypeScript)
- **TypeORM** (PostgreSQL/MySQL)
- **WooCommerce REST API**
- **Google Gemini AI**
- **Stripe, SSLCommerz**
- **JWT, Google OAuth**
- **Zod** (validation)
- **MCP (Multi-Channel Platform) Tools**

---

## 📦 Folder Structure

```
src/
  ├── app.module.ts
  ├── gemini/           # AI tools & Gemini integration
  ├── woo/              # WooCommerce integration
  ├── users/            # User management
  ├── auth/             # Auth & security
  ├── orders/           # Order management
  ├── reviews/          # Product reviews
  ├── notifications/    # Email/SMS notifications
  ├── invoice/          # Invoicing
  ├── search/           # Search tools
  └── ...
```

---

## 🧑‍💻 Usage

### **AI Customer Support Example**

Send a POST request to `/mcp` with:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "Jarvis_ai_agent",
    "arguments": {
      "customerQuery": "How do I get a refund?",
      "productList": [ { "name": "Floral Dress", "slug": "floral-dress", "category": "Dress" }, ... ],
      "refundPolicy": "30-day money-back guarantee and free returns on all products."
    }
  }
}
```

### **Order Creation Example**

Send a POST request to `/mcp` with:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_order",
    "arguments": {
      "productSlug": "floral-dress",
      "quantity": 1,
      "customerName": "Jane Doe",
      "customerEmail": "jane@example.com",
      "address": "123 Main St"
    }
  }
}
```

---

## 📝 Customization

- **Refund Policy**: Pass your own policy string from the frontend.
- **Product List**: Always send the latest product catalog for best AI results.
- **Order/Review/Subscription**: Extend or modify modules as needed for your business.

---

## 🧩 Extending

- Add new MCP tools by decorating methods with `@Tool`.
- Add new AI flows by updating the Gemini prompts and handlers.
- Integrate more payment providers or notification channels as needed.

---

## 🛡️ Security

- All sensitive endpoints are protected by JWT and role guards.
- Activity logs track all critical actions for auditability.

---

## 📄 License

MIT

---

**Built with ❤️