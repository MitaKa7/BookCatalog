# 📚 BookCatalog

**BookCatalog** is a web application built with **ASP.NET Core Web API** and **Vanilla JavaScript** that provides functionalities for managing a digital library catalog (books, authors, and categories). 

Users can register, log in, and browse or manage the catalog in a secure environment based on different access levels (roles).

👨‍💻 **Developed by:** Kristiyan Chelebiev, Dimitar Terziev, and Andrey Mitev

---

## ✨ Key Features

* **Registration and Login:** Secure user registration and login system using JWT (JSON Web Tokens).
* **Catalog Management:** Create, edit, and delete books, authors, and categories.
* **Role-Based Access Control (RBAC):** The interface and allowed actions dynamically change depending on whether the logged-in user is a regular reader, an editor, or an administrator.
* **Intuitive User Interface:** Built as a Single Page Application (SPA) for easy and fast navigation without reloading pages.

---

## 🛠️ Technologies

* **Language:** C# (Backend) / JavaScript (Frontend)
* **Framework:** ASP.NET Core Web API
* **User Interface:** HTML5, CSS3, Vanilla JavaScript (Fetch API)
* **Database:** Entity Framework Core with SQL Server (LocalDB)
* **Authentication:** ASP.NET Core Identity & JWT
* **Documentation:** Swagger / OpenAPI

---

## 🔐 Users and Roles (RBAC)

The system has different access levels. Unauthenticated users only see the login/registration screen. After a successful login, the UI adapts according to their permissions:

* 📖 **Reader:** Can browse all books, authors, and categories. Cannot delete, add, or edit any records.
* ✍️ **Editor:** Can do everything a reader does, but also has the "Edit" button unlocked to modify existing records. Can also add new books, authors, and categories.
* 🛡️ **Admin:** Has full administrative rights over the entire system. Only the admin can see the delete button and permanently remove information from the database.

---

## 📁 Project Structure

* `Controllers/` – Controllers handling HTTP requests from the frontend (Books, Authors, Categories, Auth).
* `Models/` & `DTOs/` – Models representing the application data and Data Transfer Objects.
* `Data/` – Database context (`AppDbContext`) and initialization data (Seed).
* `Frontend/` *(or the UI folder)* – Contains the static files (`index.html`, `style.css`, `script.js`) for rendering the user interface.
* `Program.cs` – Main entry point for starting the server and configuring services.

---

## 🚀 Getting Started

### 📋 Prerequisites
* Installed **.NET SDK** (v6.0 or newer)
* **SQL Server** (LocalDB)
* Visual Studio or VS Code

### 🔧 Installation and Configuration
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/MitaKa7/BookCatalog.git](https://github.com/MitaKa7/BookCatalog.git)


Apply migrations and update the database:
Open BookCatalog.sln in Visual Studio. In the Package Manager Console, run the following command to create and update the database:

PowerShell
Update-Database
(This will automatically generate the tables and create a default system Admin account).

Start the Backend (API):
Run the backend application from Visual Studio (Run button or F5). The server will start and automatically open the Swagger documentation in your browser (e.g., https://localhost:7217).

Start the Frontend:

Open the script.js file and ensure the apiBase variable matches the port your local server is running on. Open the index.html file in your browser.

