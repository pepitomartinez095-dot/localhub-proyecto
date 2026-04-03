require('dotenv').config(); // Carga las variables del archivo .env
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- CONEXIÓN A MONGODB ATLAS ---
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Conectado a MongoDB Atlas"))
    .catch(err => console.error("❌ Error de conexión:", err));

// --- MODELO DE DATOS (Schema) ---
const EmpresaSchema = new mongoose.Schema({
    nombre: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }, // En producción usar bcrypt
    categoria: String,
    plan: { type: String, default: 'gratis' },
    whatsapp: String,
    descripcion: String,
    direccion: String,
    logoUrl: String
});

const Empresa = mongoose.model('Empresa', EmpresaSchema);

const ADMIN_PASS = "MegasGaming@123";

// --- ENDPOINTS PÚBLICOS ---
app.get('/api/empresas', async (req, res) => {
    try {
        const empresas = await Empresa.find({}, '-password'); // Trae todo menos el password
        res.json(empresas);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener empresas" });
    }
});

app.get('/api/categorias', async (req, res) => {
    try {
        const categorias = await Empresa.distinct('categoria');
        res.json(categorias.filter(c => c)); // Filtra si hay nulos
    } catch (error) {
        res.status(500).json({ error: "Error al obtener categorías" });
    }
});

// --- ENDPOINTS EMPRESA (LOGIN Y PERFIL) ---
app.post('/api/empresa/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const emp = await Empresa.findOne({ email, password });
        if(emp) {
            res.json({ token: emp._id });
        } else {
            res.status(401).json({ error: "Email o contraseña incorrectos" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error en el login" });
    }
});

app.get('/api/empresa/perfil', async (req, res) => {
    const token = req.header('auth-token');
    try {
        const emp = await Empresa.findById(token);
        if(emp) res.json(emp); else res.status(401).json({ error: "No autorizado" });
    } catch (error) {
        res.status(401).json({ error: "Token inválido" });
    }
});

// --- ENDPOINTS ADMIN MAESTRO ---
app.post('/api/admin/listado', async (req, res) => {
    if(req.body.auth !== ADMIN_PASS) return res.status(401).json({ error: "Clave incorrecta" });
    const todas = await Empresa.find();
    res.json(todas);
});

app.post('/api/admin/registrar', async (req, res) => {
    if(req.body.auth !== ADMIN_PASS) return res.status(401).json({ error: "Clave incorrecta" });
    const { nombre, email, password, categoria, plan } = req.body;

    try {
        const nueva = new Empresa({ nombre, email, password, categoria, plan });
        await nueva.save();
        res.json({ mensaje: "Empresa registrada con éxito" });
    } catch (error) {
        res.status(400).json({ error: "El email ya existe o datos inválidos" });
    }
});

app.delete('/api/admin/empresa/:id', async (req, res) => {
    if(req.query.auth !== ADMIN_PASS) return res.status(401).json({ error: "Clave incorrecta" });
    try {
        await Empresa.findByIdAndDelete(req.params.id);
        res.json({ mensaje: "Empresa borrada" });
    } catch (error) {
        res.status(404).json({ error: "No encontrada" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor LocalHub funcionando en puerto ${PORT}`);
});