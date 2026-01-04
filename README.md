# 🔑 KEY-R CODE

![Banner](img/banner.png)

> **Project aiming to create a secure QR-Code–based electronic access system powered by a Raspberry Pi controlling an electric strike. The prototype includes an authentication API, a mobile application, and a rights-management database to replace manual key handling. Using Node.js, React Native, and much more.**

---

### 🛠️ Tech Stack

**Development**
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

**Infrastructure & Ops**
![Windows Server](https://img.shields.io/badge/Windows%20Server-2025-0078D7?style=for-the-badge&logo=windows&logoColor=white)
![Debian](https://img.shields.io/badge/Debian-13-A81D33?style=for-the-badge&logo=debian&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-Sanctuarised-003545?style=for-the-badge&logo=mariadb&logoColor=white)
![Hyper-V](https://img.shields.io/badge/Hyper--V-Virtualization-0078D7?style=for-the-badge&logo=microsoft&logoColor=white)

---

## 📖 About The Project

Key-R Code modernizes physical access control in educational facilities. The system replaces traditional metal keys with a robust digital infrastructure, allowing students and staff to open doors via a mobile app generating ephemeral QR Codes.

### Key Features
* **Secure Hardware**: Raspberry Pi Zero controlling a 12V electric strike via relay.
* **Mobile App**: React Native application for generating dynamic QR tokens.
* **Hybrid Infrastructure**: Virtualized environment using Microsoft Hyper-V.
* **Strong Security**:
    * **mTLS Authentication** between IoT devices and Backend.
    * **Network Segmentation** (VLANs) via pfSense firewall.
    * **Sanctuarized Database** (No internet access for data protection).

## 🏗️ System Architecture

The infrastructure is consolidated on a single physical host running Hyper-V with strictly isolated roles:

| Server | Role | OS | Description |
| :--- | :--- | :--- | :--- |
| **KRC AD** (`SRV-AD01`) | Identity | Win Srv 2025 | Centralized LDAP directory & DNS. |
| **KRC SQL** (`SRV-SQL01`) | Data | Debian 13 | Secure storage for logs & tokens. |
| **KRC BACKEND** (`SRV-WEB01`) | API | Debian 12 | Node.js/Python Orchestrator. |

## 👥 Project Team

* **Vincent VANISCOTTE** - Project Manager & Lead Dev
* **Adrien VENTRE** - Infrastructure & Security Lead
* **Célien BRANCQUART** - Application Development Lead
* **Théo FAURE** - Communication & Marketing Lead

---
*Academic Project - BUT R&T 2025-2026 - IUT de Valence.*

