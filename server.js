require('dotenv').config();
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

// --- MODELO DE DATOS ---
const EmpresaSchema = new mongoose.Schema({
    nombre: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
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
        const empresas = await Empresa.find({}, '-password');
        res.json(empresas);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener empresas" });
    }
});

app.get('/api/categorias', async (req, res) => {
    try {
        const categorias = await Empresa.distinct('categoria');
        res.json(categorias.filter(c => c));
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
        res.status(401).json({ error: "Sesión no válida" });
    }
});

// --- GUARDAR CAMBIOS PERFIL (Aquí estaba el fallo) ---
app.put('/api/empresa/perfil', async (req, res) => {
    const token = req.header('auth-token');
    const { emailConfirm, passwordConfirm, descripcion, whatsapp, direccion, logoUrl } = req.body;

    try {
        const emp = await Empresa.findById(token);
        if (!emp) return res.status(401).json({ error: "No autorizado" });

        // Verificación de seguridad antes de editar
        if (emp.email !== emailConfirm || emp.password !== passwordConfirm) {
            return res.status(400).json({ error: "Email o contraseña de confirmación incorrectos." });
        }

        // Actualizamos en la base de datos
        await Empresa.findByIdAndUpdate(token, {
            descripcion,
            whatsapp,
            direccion,
            logoUrl
        });

        res.json({ mensaje: "Perfil actualizado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al guardar los cambios" });
    }
});

// --- ENDPOINTS ADMIN MAESTRO ---
app.post('/api/admin/listado', async (req, res) => {
    if(req.body.auth !== ADMIN_PASS) return res.status(401).json({ error: "Clave incorrecta" });
    try {
        const todas = await Empresa.find();
        res.json(todas);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener listado" });
    }
});

app.post('/api/admin/registrar', async (req, res) => {
    if(req.body.auth !== ADMIN_PASS) return res.status(401).json({ error: "Clave incorrecta" });
    const { nombre, email, password, categoria, plan } = req.body;

    try {
        const nueva = new Empresa({
            nombre, email, password, categoria, plan,
            whatsapp: "", descripcion: "", direccion: "", logoUrl: ""
        });
        await nueva.save();
        res.json({ mensaje: "Empresa registrada con éxito" });
    } catch (error) {
        res.status(400).json({ error: "El email ya existe o datos incompletos" });
    }
});

app.put('/api/admin/empresa/:id', async (req, res) => {
    if(req.body.auth !== ADMIN_PASS) return res.status(401).json({ error: "Clave incorrecta" });
    try {
        const { nombre, email, categoria, plan } = req.body;
        await Empresa.findByIdAndUpdate(req.params.id, { nombre, email, categoria, plan });
        res.json({ mensaje: "Empresa actualizada por el administrador" });
    } catch (error) {
        res.status(404).json({ error: "No se pudo actualizar" });
    }
});

app.delete('/api/admin/empresa/:id', async (req, res) => {
    if(req.query.auth !== ADMIN_PASS) return res.status(401).json({ error: "Clave incorrecta" });
    try {
        await Empresa.findByIdAndDelete(req.params.id);
        res.json({ mensaje: "Empresa eliminada correctamente" });
    } catch (error) {
        res.status(404).json({ error: "No encontrada" });
    }
});

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor LocalHub funcionando en puerto ${PORT}`);
});