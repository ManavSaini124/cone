# 💬 Discord Clone - Fullstack Real-Time Chat App

A powerful, modern, and scalable real-time messaging platform inspired by Discord. Built using **Next.js 14**, **Socket.IO**, **Node.js**, and **MongoDB**, this app supports role-based permissions, private/group/public chat rooms, and a highly interactive chat UI experience.

---

## 🚀 Tech Stack

### 🖥️ Frontend

* **Next.js 14** (App Router, TypeScript)
* **Tailwind CSS** (utility-first styling)
* **ShadCN UI** (headless UI components)
* **Socket.IO-client** (real-time communication)
* **Lucide Icons** (modern icon system)
* **React Context API** (user, socket, and message state)

### 🛠️ Backend

* **Node.js** & **Express.js** (API + socket server)
* **MongoDB + Mongoose** (schema-based NoSQL DB)
* **Socket.IO** (event-based real-time engine)
* **JWT Auth (Access + Refresh tokens)**
* **Cloudinary** (media and file uploads)
* **Role-Based Access Control (RBAC)**

---

## 🎯 What Are We Building?

A production-ready, real-time messaging system featuring:

* ✅ Full authentication system (JWT, secure cookies)
* ✅ Private, group, and public rooms
* ✅ Invite system and room participant management
* ✅ Message sending, replying, editing, deleting
* ✅ Read receipts, delivery tracking
* ✅ Typing indicators, online status
* ✅ Profile actions: View, Promote, Demote, Remove
* ✅ Chat Info Panel with members, media, files
* ✅ Full mobile and desktop responsive design
* ✅ Robust Socket.IO server integrated deeply with room logic

---

## 🔐 Role-Based Permissions

| **Role**  | **Can View Profile** | **Remove Members** | **Promote/Demote** |
| --------- | -------------------- | ------------------ | ------------------ |
| Member    | ✅                    | ❌                  | ❌                  |
| Moderator | ✅                    | ✅                  | ❌                  |
| Admin     | ✅                    | ✅                  | ✅                  |

---

## 🧱 Project Structure

```
discord-clone/
├── discord/                # Backend (Node.js + MongoDB)
│   ├── models/
│   ├── routes/
│   └── socket/
├── discord-frontend/       # Frontend (Next.js + Tailwind + Socket.IO)
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   └── pages/
└── README.md
```

---

## 🔮 Future Updates

* 🔒 Email verification, password reset
* 📬 Push & in-app notifications
* 📱 PWA support (add to home screen)
* 🧵 Threads and reactions
* 📊 Room insights (admin metrics dashboard)
* 🌐 Language localization (i18n)
* 🧑‍🎨 Theme customization per user/room
* 💻 Desktop client (Electron based)

---

## 🛠️ Getting Started (Local Dev)

```bash
# 1. Clone the repo
https://github.com/YOUR_USERNAME/discord-clone.git

# 2. Install dependencies
cd discord && npm install
cd ../discord-frontend && npm install

# 3. Create .env files in both folders
# (Mongo URI, JWT secret, Cloudinary, client URL, etc.)

# 4. Run both servers
cd discord && npm run dev
cd ../discord-frontend && npm run dev
```

---

## 🤝 Contributing

Pull requests are welcome! If you find bugs or want to suggest improvements:

* Fork the repository
* Create a new branch
* Commit your changes
* Open a PR

---

## 👨‍💻 Author

Built with ❤️ by **\[Manav Saini]**

* 🔗 GitHub: [Manav Saini](https://www.linkedin.com/in/manav-saini-443b29254/)
* 📧 Email: [itsmemanavsaini@gmail.com](mailto:itsmemanavsaini@gmail.com)

---

## 📜 License

MIT License — Free to use, modify, and distribute.
