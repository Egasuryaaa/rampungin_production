# 📋 API Register Documentation - Client & Tukang

## 🔗 Endpoint

```
POST /api/auth/register
```

## 📝 Content-Type

```
multipart/form-data
```

---

## 1️⃣ REGISTER CLIENT

### Request Fields (Client)

#### **Required Fields** ✅

| Field          | Type   | Description                 | Example              |
| -------------- | ------ | --------------------------- | -------------------- |
| `username`     | String | Username unik               | `"johndoe"`          |
| `email`        | String | Email valid                 | `"john@example.com"` |
| `password`     | String | Password minimal 6 karakter | `"password123"`      |
| `nama_lengkap` | String | Nama lengkap user           | `"John Doe"`         |
| `no_telp`      | String | Nomor telepon               | `"081234567890"`     |
| `role`         | String | Harus `"client"`            | `"client"`           |

#### **Optional Fields** ⭕

| Field         | Type   | Description             | Example                  |
| ------------- | ------ | ----------------------- | ------------------------ |
| `foto_profil` | File   | Gambar profil (max 2MB) | `profile.jpg`            |
| `alamat`      | String | Alamat lengkap          | `"Jl. Sudirman No. 123"` |
| `kota`        | String | Nama kota               | `"Jakarta"`              |
| `provinsi`    | String | Nama provinsi           | `"DKI Jakarta"`          |
| `kode_pos`    | String | Kode pos                | `"12345"`                |

### Response (Client) ✅

#### Success Response (201 Created)

```json
{
  "status": "success",
  "message": "Registrasi berhasil",
  "data": {
    "user_id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "client",
    "foto_profil": "uploads/profiles/foto_profil-1234567890.jpg",
    "is_verified": true
  }
}
```

**Note:** Client langsung `is_verified: true` (auto-verified)

---

## 2️⃣ REGISTER TUKANG

### Request Fields (Tukang)

#### **Required Fields** ✅

| Field          | Type   | Description                 | Example              |
| -------------- | ------ | --------------------------- | -------------------- |
| `username`     | String | Username unik               | `"agus_tukang"`      |
| `email`        | String | Email valid                 | `"agus@example.com"` |
| `password`     | String | Password minimal 6 karakter | `"password123"`      |
| `nama_lengkap` | String | Nama lengkap tukang         | `"Agus Prakoso"`     |
| `no_telp`      | String | Nomor telepon               | `"081234567890"`     |
| `role`         | String | Harus `"tukang"`            | `"tukang"`           |

#### **Optional Fields (User Info)** ⭕

| Field         | Type   | Description           | Example                  |
| ------------- | ------ | --------------------- | ------------------------ |
| `foto_profil` | File   | Foto profil (max 2MB) | `profile.jpg`            |
| `alamat`      | String | Alamat lengkap        | `"Jl. Gatot Subroto 45"` |
| `kota`        | String | Nama kota             | `"Bandung"`              |
| `provinsi`    | String | Nama provinsi         | `"Jawa Barat"`           |
| `kode_pos`    | String | Kode pos              | `"40123"`                |

#### **Optional Fields (Profil Tukang)** ⭕

| Field                   | Type         | Description           | Example                                 |
| ----------------------- | ------------ | --------------------- | --------------------------------------- |
| `pengalaman_tahun`      | Integer      | Tahun pengalaman      | `5`                                     |
| `tarif_per_jam`         | Decimal      | Tarif per jam         | `50000`                                 |
| `bio`                   | String       | Bio singkat           | `"Tukang profesional"`                  |
| `keahlian`              | Array/String | Keahlian khusus       | `["Las", "Potong"]` atau `"Las,Potong"` |
| `kategori_ids`          | Array/String | ID kategori layanan   | `[1, 2, 3]` atau `"1,2,3"`              |
| `nama_bank`             | String       | Nama bank             | `"BCA"`                                 |
| `nomor_rekening`        | String       | Nomor rekening        | `"1234567890"`                          |
| `nama_pemilik_rekening` | String       | Nama pemilik rekening | `"Agus Prakoso"`                        |

### Response (Tukang) ✅

#### Success Response (201 Created)

```json
{
  "status": "success",
  "message": "Registrasi berhasil",
  "data": {
    "user_id": 2,
    "username": "agus_tukang",
    "email": "agus@example.com",
    "role": "tukang",
    "foto_profil": "uploads/profiles/foto_profil-1234567890.jpg",
    "is_verified": false
  }
}
```

**Note:** Tukang `is_verified: false` (perlu verifikasi admin sebelum bisa login)

---

## ❌ Error Responses

### 400 Bad Request - Field Wajib Kosong

```json
{
  "status": "error",
  "message": "Field wajib tidak boleh kosong",
  "data": null
}
```

### 400 Bad Request - Role Tidak Valid

```json
{
  "status": "error",
  "message": "Role tidak valid",
  "data": null
}
```

### 409 Conflict - Username/Email Sudah Ada

```json
{
  "status": "error",
  "message": "Username atau email sudah terdaftar",
  "data": null
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Internal Server Error",
  "data": "Error details here",
  "errors": "Error details here"
}
```

---

## 🔄 Flow Backend Register

### Flow untuk CLIENT:

```
1. Validasi input (username, email, password, nama_lengkap, no_telp, role)
2. Cek duplikat username/email
3. Hash password dengan bcrypt
4. Upload foto_profil (jika ada) → disimpan di writable/profiles/
5. Set is_verified = true (auto-verified untuk client)
6. Cari id_role untuk 'client' (default: 2)
7. Buat record di tabel users
8. Return response sukses
```

### Flow untuk TUKANG:

```
1. Validasi input (username, email, password, nama_lengkap, no_telp, role)
2. Cek duplikat username/email
3. Hash password dengan bcrypt
4. Upload foto_profil (jika ada) → disimpan di writable/profiles/
5. Set is_verified = false (perlu verifikasi admin)
6. Cari id_role untuk 'tukang' (default: 3)
7. Buat record di tabel users
8. Buat record di tabel profil_tukang (linked via user_id)
9. Buat record di tabel kategori_tukang (jika kategori_ids ada)
10. Return response sukses
```

---

## 📱 IMPLEMENTASI FLUTTER

### 1. Setup Dependencies

Tambahkan di `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  image_picker: ^1.0.4
  shared_preferences: ^2.2.2
  provider: ^6.1.1
```

### 2. Model Classes

#### `lib/models/register_request.dart`

```dart
import 'dart:io';

class RegisterRequest {
  // Required fields
  final String username;
  final String email;
  final String password;
  final String namaLengkap;
  final String noTelp;
  final String role; // "client" atau "tukang"

  // Optional user fields
  final File? fotoProfil;
  final String? alamat;
  final String? kota;
  final String? provinsi;
  final String? kodePos;

  // Optional tukang fields (hanya untuk role = "tukang")
  final int? pengalamanTahun;
  final double? tarifPerJam;
  final String? bio;
  final List<String>? keahlian;
  final List<int>? kategoriIds;
  final String? namaBank;
  final String? nomorRekening;
  final String? namaPemilikRekening;

  RegisterRequest({
    required this.username,
    required this.email,
    required this.password,
    required this.namaLengkap,
    required this.noTelp,
    required this.role,
    this.fotoProfil,
    this.alamat,
    this.kota,
    this.provinsi,
    this.kodePos,
    // Tukang fields
    this.pengalamanTahun,
    this.tarifPerJam,
    this.bio,
    this.keahlian,
    this.kategoriIds,
    this.namaBank,
    this.nomorRekening,
    this.namaPemilikRekening,
  });
}
```

#### `lib/models/register_response.dart`

```dart
class RegisterResponse {
  final String status;
  final String message;
  final RegisterData? data;

  RegisterResponse({
    required this.status,
    required this.message,
    this.data,
  });

  factory RegisterResponse.fromJson(Map<String, dynamic> json) {
    return RegisterResponse(
      status: json['status'],
      message: json['message'],
      data: json['data'] != null ? RegisterData.fromJson(json['data']) : null,
    );
  }

  bool get isSuccess => status == 'success';
}

class RegisterData {
  final int userId;
  final String username;
  final String email;
  final String role;
  final String? fotoProfil;
  final bool isVerified;

  RegisterData({
    required this.userId,
    required this.username,
    required this.email,
    required this.role,
    this.fotoProfil,
    required this.isVerified,
  });

  factory RegisterData.fromJson(Map<String, dynamic> json) {
    return RegisterData(
      userId: json['user_id'],
      username: json['username'],
      email: json['email'],
      role: json['role'],
      fotoProfil: json['foto_profil'],
      isVerified: json['is_verified'],
    );
  }
}
```

### 3. API Service

#### `lib/services/auth_service.dart`

```dart
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/register_request.dart';
import '../models/register_response.dart';

class AuthService {
  static const String baseUrl = 'http://your-api-url.com/api';

  // Register Client atau Tukang
  Future<RegisterResponse> register(RegisterRequest request) async {
    try {
      var uri = Uri.parse('$baseUrl/auth/register');
      var multipartRequest = http.MultipartRequest('POST', uri);

      // Required fields
      multipartRequest.fields['username'] = request.username;
      multipartRequest.fields['email'] = request.email;
      multipartRequest.fields['password'] = request.password;
      multipartRequest.fields['nama_lengkap'] = request.namaLengkap;
      multipartRequest.fields['no_telp'] = request.noTelp;
      multipartRequest.fields['role'] = request.role;

      // Optional user fields
      if (request.alamat != null) {
        multipartRequest.fields['alamat'] = request.alamat!;
      }
      if (request.kota != null) {
        multipartRequest.fields['kota'] = request.kota!;
      }
      if (request.provinsi != null) {
        multipartRequest.fields['provinsi'] = request.provinsi!;
      }
      if (request.kodePos != null) {
        multipartRequest.fields['kode_pos'] = request.kodePos!;
      }

      // Foto profil (jika ada)
      if (request.fotoProfil != null) {
        var file = await http.MultipartFile.fromPath(
          'foto_profil',
          request.fotoProfil!.path,
        );
        multipartRequest.files.add(file);
      }

      // Optional tukang fields (hanya jika role = "tukang")
      if (request.role == 'tukang') {
        if (request.pengalamanTahun != null) {
          multipartRequest.fields['pengalaman_tahun'] =
              request.pengalamanTahun.toString();
        }
        if (request.tarifPerJam != null) {
          multipartRequest.fields['tarif_per_jam'] =
              request.tarifPerJam.toString();
        }
        if (request.bio != null) {
          multipartRequest.fields['bio'] = request.bio!;
        }
        if (request.keahlian != null && request.keahlian!.isNotEmpty) {
          multipartRequest.fields['keahlian'] =
              jsonEncode(request.keahlian);
        }
        if (request.kategoriIds != null && request.kategoriIds!.isNotEmpty) {
          multipartRequest.fields['kategori_ids'] =
              request.kategoriIds!.join(',');
        }
        if (request.namaBank != null) {
          multipartRequest.fields['nama_bank'] = request.namaBank!;
        }
        if (request.nomorRekening != null) {
          multipartRequest.fields['nomor_rekening'] = request.nomorRekening!;
        }
        if (request.namaPemilikRekening != null) {
          multipartRequest.fields['nama_pemilik_rekening'] =
              request.namaPemilikRekening!;
        }
      }

      // Send request
      var streamedResponse = await multipartRequest.send();
      var response = await http.Response.fromStream(streamedResponse);

      // Parse response
      var jsonResponse = jsonDecode(response.body);
      return RegisterResponse.fromJson(jsonResponse);

    } catch (e) {
      return RegisterResponse(
        status: 'error',
        message: 'Terjadi kesalahan: ${e.toString()}',
      );
    }
  }
}
```

### 4. UI Screens

#### A. Register Client Screen (`lib/screens/register_client_screen.dart`)

```dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/register_request.dart';
import '../services/auth_service.dart';

class RegisterClientScreen extends StatefulWidget {
  @override
  _RegisterClientScreenState createState() => _RegisterClientScreenState();
}

class _RegisterClientScreenState extends State<RegisterClientScreen> {
  final _formKey = GlobalKey<FormState>();
  final _authService = AuthService();
  final _imagePicker = ImagePicker();

  // Controllers
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _namaLengkapController = TextEditingController();
  final _noTelpController = TextEditingController();
  final _alamatController = TextEditingController();
  final _kotaController = TextEditingController();
  final _provinsiController = TextEditingController();
  final _kodePosController = TextEditingController();

  File? _fotoProfil;
  bool _isLoading = false;

  Future<void> _pickImage() async {
    final XFile? pickedFile = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );

    if (pickedFile != null) {
      setState(() {
        _fotoProfil = File(pickedFile.path);
      });
    }
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final request = RegisterRequest(
      username: _usernameController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text,
      namaLengkap: _namaLengkapController.text.trim(),
      noTelp: _noTelpController.text.trim(),
      role: 'client', // Fixed role untuk client
      fotoProfil: _fotoProfil,
      alamat: _alamatController.text.trim().isEmpty
          ? null
          : _alamatController.text.trim(),
      kota: _kotaController.text.trim().isEmpty
          ? null
          : _kotaController.text.trim(),
      provinsi: _provinsiController.text.trim().isEmpty
          ? null
          : _provinsiController.text.trim(),
      kodePos: _kodePosController.text.trim().isEmpty
          ? null
          : _kodePosController.text.trim(),
    );

    final response = await _authService.register(request);

    setState(() => _isLoading = false);

    if (response.isSuccess) {
      // Sukses - Client auto-verified
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Registrasi Berhasil'),
          content: Text(
            'Akun client Anda telah dibuat!\n'
            'Anda dapat langsung login.'
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pushReplacementNamed('/login');
              },
              child: Text('Login Sekarang'),
            ),
          ],
        ),
      );
    } else {
      // Error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.message),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Register Client')),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    // Foto Profil
                    GestureDetector(
                      onTap: _pickImage,
                      child: CircleAvatar(
                        radius: 50,
                        backgroundImage: _fotoProfil != null
                            ? FileImage(_fotoProfil!)
                            : null,
                        child: _fotoProfil == null
                            ? Icon(Icons.camera_alt, size: 40)
                            : null,
                      ),
                    ),
                    SizedBox(height: 20),

                    // Username (Required)
                    TextFormField(
                      controller: _usernameController,
                      decoration: InputDecoration(
                        labelText: 'Username *',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Username wajib diisi';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 16),

                    // Email (Required)
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: 'Email *',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Email wajib diisi';
                        }
                        if (!value.contains('@')) {
                          return 'Email tidak valid';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 16),

                    // Password (Required)
                    TextFormField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: 'Password *',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Password wajib diisi';
                        }
                        if (value.length < 6) {
                          return 'Password minimal 6 karakter';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 16),

                    // Nama Lengkap (Required)
                    TextFormField(
                      controller: _namaLengkapController,
                      decoration: InputDecoration(
                        labelText: 'Nama Lengkap *',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Nama lengkap wajib diisi';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 16),

                    // No Telp (Required)
                    TextFormField(
                      controller: _noTelpController,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        labelText: 'No. Telepon *',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'No. telepon wajib diisi';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 16),

                    // Alamat (Optional)
                    TextFormField(
                      controller: _alamatController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        labelText: 'Alamat',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    SizedBox(height: 16),

                    // Kota (Optional)
                    TextFormField(
                      controller: _kotaController,
                      decoration: InputDecoration(
                        labelText: 'Kota',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    SizedBox(height: 16),

                    // Provinsi (Optional)
                    TextFormField(
                      controller: _provinsiController,
                      decoration: InputDecoration(
                        labelText: 'Provinsi',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    SizedBox(height: 16),

                    // Kode Pos (Optional)
                    TextFormField(
                      controller: _kodePosController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Kode Pos',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    SizedBox(height: 24),

                    // Register Button
                    ElevatedButton(
                      onPressed: _register,
                      style: ElevatedButton.styleFrom(
                        minimumSize: Size(double.infinity, 50),
                      ),
                      child: Text('DAFTAR', style: TextStyle(fontSize: 16)),
                    ),

                    SizedBox(height: 16),
                    Text('* Field wajib diisi'),
                  ],
                ),
              ),
            ),
    );
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _namaLengkapController.dispose();
    _noTelpController.dispose();
    _alamatController.dispose();
    _kotaController.dispose();
    _provinsiController.dispose();
    _kodePosController.dispose();
    super.dispose();
  }
}
```

#### B. Register Tukang Screen (`lib/screens/register_tukang_screen.dart`)

```dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/register_request.dart';
import '../services/auth_service.dart';

class RegisterTukangScreen extends StatefulWidget {
  @override
  _RegisterTukangScreenState createState() => _RegisterTukangScreenState();
}

class _RegisterTukangScreenState extends State<RegisterTukangScreen> {
  final _formKey = GlobalKey<FormState>();
  final _authService = AuthService();
  final _imagePicker = ImagePicker();

  // Basic Controllers
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _namaLengkapController = TextEditingController();
  final _noTelpController = TextEditingController();
  final _alamatController = TextEditingController();
  final _kotaController = TextEditingController();
  final _provinsiController = TextEditingController();
  final _kodePosController = TextEditingController();

  // Tukang Specific Controllers
  final _pengalamanTahunController = TextEditingController();
  final _tarifPerJamController = TextEditingController();
  final _bioController = TextEditingController();
  final _keahlianController = TextEditingController();
  final _kategoriIdsController = TextEditingController();
  final _namaBankController = TextEditingController();
  final _nomorRekeningController = TextEditingController();
  final _namaPemilikRekeningController = TextEditingController();

  File? _fotoProfil;
  bool _isLoading = false;

  Future<void> _pickImage() async {
    final XFile? pickedFile = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 85,
    );

    if (pickedFile != null) {
      setState(() {
        _fotoProfil = File(pickedFile.path);
      });
    }
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    // Parse keahlian (comma separated)
    List<String>? keahlian;
    if (_keahlianController.text.trim().isNotEmpty) {
      keahlian = _keahlianController.text
          .split(',')
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList();
    }

    // Parse kategori IDs (comma separated)
    List<int>? kategoriIds;
    if (_kategoriIdsController.text.trim().isNotEmpty) {
      kategoriIds = _kategoriIdsController.text
          .split(',')
          .map((e) => int.tryParse(e.trim()))
          .where((e) => e != null)
          .cast<int>()
          .toList();
    }

    final request = RegisterRequest(
      username: _usernameController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text,
      namaLengkap: _namaLengkapController.text.trim(),
      noTelp: _noTelpController.text.trim(),
      role: 'tukang', // Fixed role untuk tukang
      fotoProfil: _fotoProfil,
      alamat: _alamatController.text.trim().isEmpty
          ? null
          : _alamatController.text.trim(),
      kota: _kotaController.text.trim().isEmpty
          ? null
          : _kotaController.text.trim(),
      provinsi: _provinsiController.text.trim().isEmpty
          ? null
          : _provinsiController.text.trim(),
      kodePos: _kodePosController.text.trim().isEmpty
          ? null
          : _kodePosController.text.trim(),
      // Tukang specific
      pengalamanTahun: _pengalamanTahunController.text.trim().isEmpty
          ? null
          : int.tryParse(_pengalamanTahunController.text.trim()),
      tarifPerJam: _tarifPerJamController.text.trim().isEmpty
          ? null
          : double.tryParse(_tarifPerJamController.text.trim()),
      bio: _bioController.text.trim().isEmpty
          ? null
          : _bioController.text.trim(),
      keahlian: keahlian,
      kategoriIds: kategoriIds,
      namaBank: _namaBankController.text.trim().isEmpty
          ? null
          : _namaBankController.text.trim(),
      nomorRekening: _nomorRekeningController.text.trim().isEmpty
          ? null
          : _nomorRekeningController.text.trim(),
      namaPemilikRekening: _namaPemilikRekeningController.text.trim().isEmpty
          ? null
          : _namaPemilikRekeningController.text.trim(),
    );

    final response = await _authService.register(request);

    setState(() => _isLoading = false);

    if (response.isSuccess) {
      // Sukses - Tukang perlu verifikasi admin
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: Text('Registrasi Berhasil'),
          content: Text(
            'Akun tukang Anda telah dibuat!\n\n'
            '⚠️ Akun Anda perlu diverifikasi oleh Admin terlebih dahulu '
            'sebelum dapat login.\n\n'
            'Mohon tunggu konfirmasi dari Admin.'
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context).pushReplacementNamed('/login');
              },
              child: Text('OK'),
            ),
          ],
        ),
      );
    } else {
      // Error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.message),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Register Tukang')),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Foto Profil
                    Center(
                      child: GestureDetector(
                        onTap: _pickImage,
                        child: CircleAvatar(
                          radius: 50,
                          backgroundImage: _fotoProfil != null
                              ? FileImage(_fotoProfil!)
                              : null,
                          child: _fotoProfil == null
                              ? Icon(Icons.camera_alt, size: 40)
                              : null,
                        ),
                      ),
                    ),
                    SizedBox(height: 20),

                    // INFORMASI AKUN
                    Text(
                      'INFORMASI AKUN',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Divider(),
                    SizedBox(height: 10),

                    _buildTextField(
                      controller: _usernameController,
                      label: 'Username *',
                      required: true,
                    ),
                    _buildTextField(
                      controller: _emailController,
                      label: 'Email *',
                      keyboardType: TextInputType.emailAddress,
                      required: true,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Email wajib diisi';
                        }
                        if (!value.contains('@')) {
                          return 'Email tidak valid';
                        }
                        return null;
                      },
                    ),
                    _buildTextField(
                      controller: _passwordController,
                      label: 'Password *',
                      obscureText: true,
                      required: true,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Password wajib diisi';
                        }
                        if (value.length < 6) {
                          return 'Password minimal 6 karakter';
                        }
                        return null;
                      },
                    ),
                    _buildTextField(
                      controller: _namaLengkapController,
                      label: 'Nama Lengkap *',
                      required: true,
                    ),
                    _buildTextField(
                      controller: _noTelpController,
                      label: 'No. Telepon *',
                      keyboardType: TextInputType.phone,
                      required: true,
                    ),

                    SizedBox(height: 20),

                    // INFORMASI ALAMAT
                    Text(
                      'INFORMASI ALAMAT',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Divider(),
                    SizedBox(height: 10),

                    _buildTextField(
                      controller: _alamatController,
                      label: 'Alamat',
                      maxLines: 3,
                    ),
                    _buildTextField(
                      controller: _kotaController,
                      label: 'Kota',
                    ),
                    _buildTextField(
                      controller: _provinsiController,
                      label: 'Provinsi',
                    ),
                    _buildTextField(
                      controller: _kodePosController,
                      label: 'Kode Pos',
                      keyboardType: TextInputType.number,
                    ),

                    SizedBox(height: 20),

                    // PROFIL TUKANG
                    Text(
                      'PROFIL TUKANG',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Divider(),
                    SizedBox(height: 10),

                    _buildTextField(
                      controller: _pengalamanTahunController,
                      label: 'Pengalaman (Tahun)',
                      keyboardType: TextInputType.number,
                      hint: 'Contoh: 5',
                    ),
                    _buildTextField(
                      controller: _tarifPerJamController,
                      label: 'Tarif Per Jam (Rp)',
                      keyboardType: TextInputType.number,
                      hint: 'Contoh: 50000',
                    ),
                    _buildTextField(
                      controller: _bioController,
                      label: 'Bio',
                      maxLines: 3,
                      hint: 'Ceritakan tentang keahlian Anda',
                    ),
                    _buildTextField(
                      controller: _keahlianController,
                      label: 'Keahlian',
                      hint: 'Pisahkan dengan koma. Contoh: Las, Potong, Servis',
                    ),
                    _buildTextField(
                      controller: _kategoriIdsController,
                      label: 'ID Kategori Layanan',
                      hint: 'Pisahkan dengan koma. Contoh: 1, 2, 3',
                    ),

                    SizedBox(height: 20),

                    // INFORMASI BANK
                    Text(
                      'INFORMASI BANK',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Divider(),
                    SizedBox(height: 10),

                    _buildTextField(
                      controller: _namaBankController,
                      label: 'Nama Bank',
                      hint: 'Contoh: BCA, Mandiri',
                    ),
                    _buildTextField(
                      controller: _nomorRekeningController,
                      label: 'Nomor Rekening',
                      keyboardType: TextInputType.number,
                    ),
                    _buildTextField(
                      controller: _namaPemilikRekeningController,
                      label: 'Nama Pemilik Rekening',
                    ),

                    SizedBox(height: 24),

                    // Register Button
                    ElevatedButton(
                      onPressed: _register,
                      style: ElevatedButton.styleFrom(
                        minimumSize: Size(double.infinity, 50),
                        backgroundColor: Colors.blue,
                      ),
                      child: Text(
                        'DAFTAR SEBAGAI TUKANG',
                        style: TextStyle(fontSize: 16, color: Colors.white),
                      ),
                    ),

                    SizedBox(height: 16),
                    Center(child: Text('* Field wajib diisi')),
                    SizedBox(height: 8),
                    Center(
                      child: Text(
                        'Akun tukang perlu diverifikasi Admin',
                        style: TextStyle(
                          color: Colors.orange,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    String? hint,
    TextInputType? keyboardType,
    bool obscureText = false,
    int maxLines = 1,
    bool required = false,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        obscureText: obscureText,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          border: OutlineInputBorder(),
        ),
        validator: validator ??
            (required
                ? (value) {
                    if (value == null || value.isEmpty) {
                      return '$label wajib diisi';
                    }
                    return null;
                  }
                : null),
      ),
    );
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _namaLengkapController.dispose();
    _noTelpController.dispose();
    _alamatController.dispose();
    _kotaController.dispose();
    _provinsiController.dispose();
    _kodePosController.dispose();
    _pengalamanTahunController.dispose();
    _tarifPerJamController.dispose();
    _bioController.dispose();
    _keahlianController.dispose();
    _kategoriIdsController.dispose();
    _namaBankController.dispose();
    _nomorRekeningController.dispose();
    _namaPemilikRekeningController.dispose();
    super.dispose();
  }
}
```

### 5. Routing Setup

#### `lib/main.dart`

```dart
import 'package:flutter/material.dart';
import 'screens/register_client_screen.dart';
import 'screens/register_tukang_screen.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rampungin App',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      initialRoute: '/role-selection',
      routes: {
        '/role-selection': (context) => RoleSelectionScreen(),
        '/register-client': (context) => RegisterClientScreen(),
        '/register-tukang': (context) => RegisterTukangScreen(),
        '/login': (context) => LoginScreen(), // Buat screen ini sendiri
      },
    );
  }
}

// Screen untuk pilih role
class RoleSelectionScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Pilih Role')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(context, '/register-client');
              },
              child: Text('Daftar sebagai Client'),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(context, '/register-tukang');
              },
              child: Text('Daftar sebagai Tukang'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 🎯 Key Points untuk Flutter Implementation

### 1. **Permission Setup**

#### Android (`android/app/src/main/AndroidManifest.xml`):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

#### iOS (`ios/Runner/Info.plist`):

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Aplikasi membutuhkan akses galeri untuk upload foto profil</string>
<key>NSCameraUsageDescription</key>
<string>Aplikasi membutuhkan akses kamera untuk foto profil</string>
```

### 2. **Perbedaan Client vs Tukang**

| Aspek               | Client        | Tukang                           |
| ------------------- | ------------- | -------------------------------- |
| **is_verified**     | `true` (auto) | `false` (perlu verifikasi admin) |
| **Bisa Login**      | ✅ Langsung   | ❌ Tunggu verifikasi             |
| **Profil Tambahan** | Tidak ada     | `profil_tukang` table            |
| **Kategori**        | Tidak ada     | `kategori_tukang` table          |

### 3. **Validasi di Flutter**

```dart
// Username: required, tidak boleh kosong
// Email: required, harus format email valid
// Password: required, minimal 6 karakter
// Nama Lengkap: required
// No Telp: required
// Role: required, harus "client" atau "tukang"

// Foto: optional, max 2MB
// Alamat, Kota, Provinsi, Kode Pos: optional

// Untuk Tukang:
// Pengalaman, Tarif, Bio, Keahlian, Kategori: optional
// Bank info: optional
```

### 4. **Error Handling**

```dart
try {
  final response = await authService.register(request);

  if (response.isSuccess) {
    // Handle sukses
    if (response.data?.role == 'client') {
      // Client auto-verified, langsung ke login
    } else {
      // Tukang perlu verifikasi, tampilkan pesan tunggu
    }
  } else {
    // Handle error dari server
    showError(response.message);
  }
} catch (e) {
  // Handle network error
  showError('Koneksi gagal: $e');
}
```

### 5. **Best Practices**

✅ Gunakan `TextEditingController` untuk semua input
✅ Validasi form dengan `GlobalKey<FormState>`
✅ Tampilkan loading indicator saat proses
✅ Compress gambar sebelum upload (max 2MB)
✅ Dispose controllers di `dispose()` method
✅ Handle error dengan baik (network, validation, server)
✅ Berikan feedback yang jelas untuk user

---

## 📚 Testing Checklist

### Client Register Test:

- [ ] Required fields validation
- [ ] Upload foto profil
- [ ] Success response `is_verified: true`
- [ ] Redirect ke login setelah sukses
- [ ] Handle error 409 (duplicate username/email)

### Tukang Register Test:

- [ ] Required fields validation
- [ ] Optional tukang fields (pengalaman, tarif, dll)
- [ ] Upload foto profil
- [ ] Success response `is_verified: false`
- [ ] Tampilkan pesan "tunggu verifikasi admin"
- [ ] Handle error 409 (duplicate username/email)

---

## 🔐 Security Notes

1. **Password**: Di-hash dengan bcrypt (12 rounds) di backend
2. **File Upload**: Max 2MB, hanya gambar (image/\*)
3. **Validasi**: Double validation (client + server)
4. **Role**: Fixed di Flutter, tidak bisa diubah user
5. **Verifikasi**: Tukang harus tunggu admin verify

---

---

## 🔐 LOGIN API & VERIFIKASI TUKANG

### Endpoint Login

```
POST /api/auth/login
```

### Request Body

```json
{
  "username": "agus_tukang", // atau bisa pakai "email"
  "password": "password123"
}
```

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "username": "agus_tukang",
      "email": "agus@example.com",
      "nama_lengkap": "Agus Prakoso",
      "foto_profil": "uploads/profiles/foto_profil-1234567890.jpg",
      "poin": 0,
      "is_active": true,
      "is_verified": true,
      "id_role": 3
    },
    "role": {
      "id": 3,
      "name": "tukang",
      "description": "Tukang Role"
    }
  }
}
```

### Error Responses untuk Tukang Belum Verified

#### ⚠️ 403 Forbidden - Tukang Belum Diverifikasi

```json
{
  "status": "error",
  "message": "Akun Tukang Anda belum diverifikasi oleh Admin",
  "data": null
}
```

**Catatan Penting:** Ini adalah response khusus yang harus di-handle di Flutter untuk menampilkan pesan yang tepat ke user!

#### ❌ Error Responses Lainnya

**401 Unauthorized - Username/Email Salah:**

```json
{
  "status": "error",
  "message": "Username/Email tidak ditemukan",
  "data": null
}
```

**401 Unauthorized - Password Salah:**

```json
{
  "status": "error",
  "message": "Password salah",
  "data": null
}
```

**403 Forbidden - Akun Tidak Aktif:**

```json
{
  "status": "error",
  "message": "Akun Anda tidak aktif",
  "data": null
}
```

---

## 📱 IMPLEMENTASI LOGIN DI FLUTTER

### 1. Model Login Request & Response

#### `lib/models/login_request.dart`

```dart
class LoginRequest {
  final String identifier; // username atau email
  final String password;

  LoginRequest({
    required this.identifier,
    required this.password,
  });
}
```

#### `lib/models/login_response.dart`

```dart
class LoginResponse {
  final String status;
  final String message;
  final LoginData? data;

  LoginResponse({
    required this.status,
    required this.message,
    this.data,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      status: json['status'],
      message: json['message'],
      data: json['data'] != null ? LoginData.fromJson(json['data']) : null,
    );
  }

  bool get isSuccess => status == 'success';
}

class LoginData {
  final String token;
  final UserData user;
  final RoleData role;

  LoginData({
    required this.token,
    required this.user,
    required this.role,
  });

  factory LoginData.fromJson(Map<String, dynamic> json) {
    return LoginData(
      token: json['token'],
      user: UserData.fromJson(json['user']),
      role: RoleData.fromJson(json['role']),
    );
  }
}

class UserData {
  final int id;
  final String username;
  final String email;
  final String namaLengkap;
  final String? fotoProfil;
  final int poin;
  final bool isActive;
  final bool isVerified;
  final int idRole;

  UserData({
    required this.id,
    required this.username,
    required this.email,
    required this.namaLengkap,
    this.fotoProfil,
    required this.poin,
    required this.isActive,
    required this.isVerified,
    required this.idRole,
  });

  factory UserData.fromJson(Map<String, dynamic> json) {
    return UserData(
      id: json['id'],
      username: json['username'],
      email: json['email'],
      namaLengkap: json['nama_lengkap'],
      fotoProfil: json['foto_profil'],
      poin: json['poin'],
      isActive: json['is_active'],
      isVerified: json['is_verified'],
      idRole: json['id_role'],
    );
  }
}

class RoleData {
  final int id;
  final String name;
  final String? description;

  RoleData({
    required this.id,
    required this.name,
    this.description,
  });

  factory RoleData.fromJson(Map<String, dynamic> json) {
    return RoleData(
      id: json['id'],
      name: json['name'],
      description: json['description'],
    );
  }
}
```

### 2. Update AuthService dengan Login Method

#### `lib/services/auth_service.dart`

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/login_request.dart';
import '../models/login_response.dart';
import '../models/register_request.dart';
import '../models/register_response.dart';

class AuthService {
  static const String baseUrl = 'http://your-api-url.com/api';

  // Login Method
  Future<LoginResponse> login(LoginRequest request) async {
    try {
      var uri = Uri.parse('$baseUrl/auth/login');

      var response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': request.identifier, // Bisa username atau email
          'password': request.password,
        }),
      );

      var jsonResponse = jsonDecode(response.body);
      return LoginResponse.fromJson(jsonResponse);

    } catch (e) {
      return LoginResponse(
        status: 'error',
        message: 'Terjadi kesalahan: ${e.toString()}',
      );
    }
  }

  // Register method sudah ada sebelumnya...
  Future<RegisterResponse> register(RegisterRequest request) async {
    // ... kode register yang sudah ada
  }
}
```

### 3. Login Screen dengan Handling Verifikasi Tukang

#### `lib/screens/login_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/login_request.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _authService = AuthService();

  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final request = LoginRequest(
      identifier: _identifierController.text.trim(),
      password: _passwordController.text,
    );

    final response = await _authService.login(request);

    setState(() => _isLoading = false);

    if (response.isSuccess && response.data != null) {
      // ✅ LOGIN BERHASIL

      // Simpan token dan data user
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', response.data!.token);
      await prefs.setString('user_id', response.data!.user.id.toString());
      await prefs.setString('role', response.data!.role.name);
      await prefs.setBool('is_verified', response.data!.user.isVerified);

      // Redirect berdasarkan role
      if (response.data!.role.name == 'client') {
        Navigator.pushReplacementNamed(context, '/client-home');
      } else if (response.data!.role.name == 'tukang') {
        Navigator.pushReplacementNamed(context, '/tukang-home');
      }

    } else {
      // ❌ LOGIN GAGAL - Handle error

      // PENTING: Cek apakah error 403 untuk tukang belum verified
      if (response.message.contains('belum diverifikasi')) {
        _showVerificationDialog();
      } else {
        // Error lainnya (username salah, password salah, dll)
        _showErrorSnackbar(response.message);
      }
    }
  }

  // Dialog khusus untuk tukang yang belum diverifikasi
  void _showVerificationDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        icon: Icon(
          Icons.access_time,
          color: Colors.orange,
          size: 50,
        ),
        title: Text(
          'Akun Belum Diverifikasi',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Akun tukang Anda sedang dalam proses verifikasi oleh Admin.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14),
            ),
            SizedBox(height: 16),
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.info_outline,
                           size: 18,
                           color: Colors.orange.shade700),
                      SizedBox(width: 8),
                      Text(
                        'Informasi:',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.orange.shade900,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),
                  Text(
                    '• Proses verifikasi biasanya memakan waktu 1-2 hari kerja\n'
                    '• Anda akan menerima notifikasi setelah akun diverifikasi\n'
                    '• Silakan coba login kembali nanti',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.orange.shade900,
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 12),
            Text(
              'Mohon bersabar menunggu verifikasi dari Admin.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                fontStyle: FontStyle.italic,
                color: Colors.grey.shade700,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('OK, Mengerti'),
          ),
        ],
      ),
    );
  }

  // Snackbar untuk error biasa
  void _showErrorSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        duration: Duration(seconds: 4),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Login'),
        centerTitle: true,
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Logo atau Header
                    SizedBox(height: 40),
                    Icon(
                      Icons.construction,
                      size: 80,
                      color: Theme.of(context).primaryColor,
                    ),
                    SizedBox(height: 16),
                    Text(
                      'RAMPUNGIN',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Temukan tukang terpercaya di sekitar Anda',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 14,
                      ),
                    ),
                    SizedBox(height: 40),

                    // Username/Email Field
                    TextFormField(
                      controller: _identifierController,
                      decoration: InputDecoration(
                        labelText: 'Username atau Email',
                        prefixIcon: Icon(Icons.person),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Username atau Email wajib diisi';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 16),

                    // Password Field
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: Icon(Icons.lock),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_off
                                : Icons.visibility,
                          ),
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Password wajib diisi';
                        }
                        return null;
                      },
                    ),
                    SizedBox(height: 24),

                    // Login Button
                    ElevatedButton(
                      onPressed: _login,
                      style: ElevatedButton.styleFrom(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'LOGIN',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),

                    SizedBox(height: 16),

                    // Divider
                    Row(
                      children: [
                        Expanded(child: Divider()),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          child: Text('ATAU'),
                        ),
                        Expanded(child: Divider()),
                      ],
                    ),

                    SizedBox(height: 16),

                    // Register Buttons
                    OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pushNamed(context, '/register-client');
                      },
                      icon: Icon(Icons.person_add),
                      label: Text('Daftar sebagai Client'),
                      style: OutlinedButton.styleFrom(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),

                    SizedBox(height: 8),

                    OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pushNamed(context, '/register-tukang');
                      },
                      icon: Icon(Icons.construction),
                      label: Text('Daftar sebagai Tukang'),
                      style: OutlinedButton.styleFrom(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),

                    SizedBox(height: 24),

                    // Info untuk Tukang
                    Container(
                      padding: EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.info_outline,
                            color: Colors.blue.shade700,
                            size: 20,
                          ),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Akun tukang perlu verifikasi admin sebelum bisa login',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.blue.shade900,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
```

---

## 🚀 Next Steps After Register

### Untuk Client:

1. ✅ Registrasi berhasil → `is_verified: true`
2. ✅ Redirect ke login screen
3. ✅ Login langsung berhasil
4. ✅ Akses semua fitur client

### Untuk Tukang:

1. ✅ Registrasi berhasil → `is_verified: false`
2. ⚠️ Tampilkan pesan: "Tunggu verifikasi admin"
3. ❌ **Tidak bisa login** sampai admin verify
4. ❌ **Login gagal** dengan error 403: "Akun Tukang Anda belum diverifikasi oleh Admin"
5. 📱 **Flutter menampilkan dialog** khusus dengan informasi:
   - Akun sedang dalam proses verifikasi
   - Proses memakan waktu 1-2 hari kerja
   - Akan menerima notifikasi setelah diverifikasi
   - Silakan coba login kembali nanti
6. 👨‍💼 Admin verify melalui dashboard admin
7. ✅ Setelah verified → bisa login dan akses fitur tukang

---

## 🎯 Testing Flow Login untuk Tukang

### Test Case 1: Tukang Belum Verified

```
1. Register sebagai tukang
2. Response: is_verified = false
3. Coba login dengan username/password yang benar
4. Backend response: 403 Forbidden
5. Message: "Akun Tukang Anda belum diverifikasi oleh Admin"
6. Flutter detect message → tampilkan dialog verifikasi
7. User klik OK → kembali ke login screen
```

### Test Case 2: Tukang Sudah Verified

```
1. Admin verify akun tukang (set is_verified = true)
2. Tukang coba login dengan username/password yang benar
3. Backend response: 200 OK + token + user data
4. Flutter save token → redirect ke tukang home
5. Tukang bisa akses semua fitur
```

### Test Case 3: Username/Password Salah

```
1. Input username/email salah
2. Backend response: 401 Unauthorized
3. Message: "Username/Email tidak ditemukan"
4. Flutter tampilkan error snackbar (bukan dialog)

ATAU

1. Input password salah
2. Backend response: 401 Unauthorized
3. Message: "Password salah"
4. Flutter tampilkan error snackbar (bukan dialog)
```

---

## 📋 Checklist Implementation

### Backend (Sudah OK ✅):

- [x] Login endpoint: `POST /api/auth/login`
- [x] Cek `is_verified` untuk role tukang
- [x] Return 403 jika tukang belum verified
- [x] Message: "Akun Tukang Anda belum diverifikasi oleh Admin"

### Flutter (Perlu Implementasi):

- [ ] Model `LoginRequest` dan `LoginResponse`
- [ ] Update `AuthService` dengan method `login()`
- [ ] Buat `LoginScreen` dengan form login
- [ ] Handle response 403 untuk tukang belum verified
- [ ] Tampilkan dialog khusus dengan UI yang informatif
- [ ] Handle error lainnya (401, 500, network error)
- [ ] Save token ke SharedPreferences jika login sukses
- [ ] Redirect ke home sesuai role (client/tukang)
- [ ] Info banner di login screen tentang verifikasi tukang

---

## 🎨 UI/UX Best Practices

### Dialog Verifikasi Tukang:

✅ **DO:**

- Gunakan icon warning/clock berwarna orange
- Judul jelas: "Akun Belum Diverifikasi"
- Penjelasan lengkap tapi singkat
- Tampilkan estimasi waktu verifikasi
- Berikan instruksi apa yang harus dilakukan
- Button "OK, Mengerti" yang clear

❌ **DON'T:**

- Jangan gunakan error icon merah (bukan error, tapi info)
- Jangan membuat user bingung
- Jangan lupa sertakan informasi waktu verifikasi
- Jangan allow dismiss dengan tap outside (barrierDismissible: false)

### Error Handling:

- **403 Verifikasi** → Dialog informatif dengan icon orange
- **401 Username/Password** → Snackbar merah
- **500 Server Error** → Snackbar merah
- **Network Error** → Snackbar merah dengan retry button

---

📌 **Catatan Penting:**

- Ganti `http://your-api-url.com` dengan URL API production Anda
- Test di emulator dan real device
- Handle semua edge cases (no internet, timeout, dll)
- Implementasi loading state untuk UX yang baik
- **Pastikan dialog verifikasi hanya muncul untuk error 403 tukang belum verified**
- **Error lainnya tetap pakai snackbar biasa**
