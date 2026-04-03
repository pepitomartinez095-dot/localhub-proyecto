const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Base de datos simulada en memoria (Para empezar rápido)
let empresas = [
    { _id: "1", nombre: "Taller Ruedas", email: "taller@a.com", password: "123", categoria: "Talleres", plan: "gratis", whatsapp: "34600112233", descripcion: "Arreglamos tu coche rápido.", logoUrl: "" },
    { _id: "2", nombre: "Restaurante El Chef", email: "chef@a.com", password: "123", categoria: "Restaurantes", plan: "premium", whatsapp: "34666555444", descripcion: "La mejor comida de la ciudad.", logoUrl: "" }
];

const ADMIN_PASS = "MegasGaming@123";

// --- ENDPOINTS PÚBLICOS ---
app.get('/api/empresas', (req, res) => {
    // Mandamos todo menos las contraseñas
    const seguras = empresas.map(({password, ...resto}) => resto);
    res.json(seguras);
});

app.get('/api/categorias', (req, res) => {
    const categorias = [...new Set(empresas.map(e => e.categoria).filter(c => c))];
    res.json(categorias);
});

// --- ENDPOINTS EMPRESA (LOGIN Y PERFIL) ---
app.post('/api/empresa/login', (req, res) => {
    const { email, password } = req.body;
    const emp = empresas.find(e => e.email === email && e.password === password);
    if(emp) {
        // En un proyecto real se usa JWT, aquí usamos el ID como token básico
        res.json({ token: emp._id });
    } else {
        res.status(401).json({ error: "Email o contraseña incorrectos" });
    }
});

app.get('/api/empresa/perfil', (req, res) => {
    const token = req.header('auth-token');
    const emp = empresas.find(e => e._id === token);
    if(emp) res.json(emp); else res.status(401).json({ error: "No autorizado" });
});

app.put('/api/empresa/perfil', (req, res) => {
    const token = req.header('auth-token');
    const { emailConfirm, passwordConfirm, descripcion, whatsapp, direccion, logoUrl } = req.body;
    
    const index = empresas.findIndex(e => e._id === token);
    if(index === -1) return res.status(401).json({ error: "No autorizado" });

    if(empresas[index].email !== emailConfirm || empresas[index].password !== passwordConfirm) {
        return res.status(400).json({ error: "Credenciales de seguridad incorrectas." });
    }

    empresas[index] = { ...empresas[index], descripcion, whatsapp, direccion, logoUrl };
    res.json({ mensaje: "Perfil actualizado correctamente" });
});

// --- ENDPOINTS ADMIN MAESTRO ---
app.post('/api/admin/listado', (req, res) => {
    if(req.body.auth !== ADMIN_PASS) return res.status(401).json({ error: "Clave incorrecta" });
    res.json(empresas);
});

app.post('/api/admin/registrar', (req, res) => {
    if(req.body.auth !== ADMIN_PASS) return res.status(401).json({ error: "Clave incorrecta" });
    const { nombre, email, password, categoria, plan } = req.body;
    
    if(empresas.find(e => e.email === email)) return res.status(400).json({ error: "El email ya existe" });

    const nueva = {
        _id: Date.now().toString(), nombre, email, password, categoria, plan,
        whatsapp: "", descripcion: "", direccion: "", logoUrl: ""
    };
    empresas.push(nueva);
    res.json({ mensaje: "Empresa registrada con éxito" });
});

app.put('/api/admin/empresa/:id', (req, res) => {
    if(req.body.auth !== ADMIN_PASS) return res.status(401).json({ error: "Clave incorrecta" });
    const { nombre, email, categoria, plan } = req.body;
    
    const index = empresas.findIndex(e => e._id === req.params.id);
    if(index !== -1) {
        empresas[index] = { ...empresas[index], nombre, email, categoria, plan };
        res.json({ mensaje: "Empresa actualizada" });
    } else {
        res.status(404).json({ error: "No encontrada" });
    }
});

app.delete('/api/admin/empresa/:id', (req, res) => {
    if(req.query.auth !== ADMIN_PASS) return res.status(401).json({ error: "Clave incorrecta" });
    empresas = empresas.filter(e => e._id !== req.params.id);
    res.json({ mensaje: "Empresa borrada" });
});

// Busca el final de tu archivo y cámbialo por esto:
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor funcionando en el puerto ${PORT}`);
});