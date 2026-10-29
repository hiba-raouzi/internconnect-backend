const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Dossier pour stocker les CV en PDF
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

const JWT_SECRET = 'secret_internconnect_pfa_2026';

// Configuration Multer (Upload CV PDF)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `cv_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// Connexion à MySQL (avec multipleStatements pour créer les tables automatiquement)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à MySQL :', err.message);
        return;
    }
    console.log('✅ Connecte a MySQL ! Verification des tables...');

    // Création automatique de la base et des tables si elles n'existent pas
    const initSQL = `
        CREATE DATABASE IF NOT EXISTS internconnect;
        USE internconnect;

        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('ETUDIANT', 'ENTREPRISE', 'ADMIN') NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS student_profiles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            nom VARCHAR(100) NOT NULL,
            prenom VARCHAR(100) NOT NULL,
            niveau VARCHAR(100) DEFAULT '5eme annee Ingenierie',
            competences TEXT,
            cv_url VARCHAR(255),
            bio TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS company_profiles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            nom_entreprise VARCHAR(150) NOT NULL,
            secteur VARCHAR(100),
            site_web VARCHAR(255),
            description TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS internship_offers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT NOT NULL,
            titre VARCHAR(200) NOT NULL,
            description TEXT NOT NULL,
            technologies_requises TEXT NOT NULL,
            duree VARCHAR(50),
            localisation VARCHAR(100),
            statut ENUM('OUVERTE', 'FERMEE') DEFAULT 'OUVERTE',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES company_profiles(id) ON DELETE CASCADE
        );
    `;

    db.query(initSQL, (errInit) => {
        if (errInit) console.error('Erreur initialisation tables :', errInit.message);
        else console.log('✅ Base internconnect et les 4 tables sont pretes !');
    });
});

// Middleware vérification JWT
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(403).json({ message: 'Token requis' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Token invalide' });
        req.user = decoded;
        next();
    });
};

// 1. INSCRIPTION (REGISTER)
app.post('/api/auth/register', async (req, res) => {
    const { email, password, role, nom, prenom, nom_entreprise } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Email, mot de passe et rôle sont obligatoires' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sqlUser = 'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)';
        
        db.query(sqlUser, [email, hashedPassword, role], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'Cet email est déjà utilisé' });
                }
                return res.status(500).json({ message: err.message });
            }

            const userId = result.insertId;

            if (role === 'ETUDIANT') {
                db.query('INSERT INTO student_profiles (user_id, nom, prenom) VALUES (?, ?, ?)', [userId, nom || '', prenom || '']);
            } else if (role === 'ENTREPRISE') {
                db.query('INSERT INTO company_profiles (user_id, nom_entreprise) VALUES (?, ?)', [userId, nom_entreprise || '']);
            }

            res.status(201).json({ message: 'Compte créé avec succès !', userId });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. CONNEXION (LOGIN)
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        if (results.length === 0) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Connexion réussie !',
            token,
            user: { id: user.id, email: user.email, role: user.role }
        });
    });
});

// 3. PROFIL ÉTUDIANT & CV PDF
app.get('/api/student/profile', verifyToken, (req, res) => {
    db.query('SELECT * FROM student_profiles WHERE user_id = ?', [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results[0] || {});
    });
});

app.put('/api/student/profile', verifyToken, upload.single('cv'), (req, res) => {
    const { nom, prenom, competences, bio } = req.body;
    const cvUrl = req.file ? `/uploads/${req.file.filename}` : req.body.cv_url;

    const sql = 'UPDATE student_profiles SET nom = ?, prenom = ?, competences = ?, bio = ?, cv_url = ? WHERE user_id = ?';
    db.query(sql, [nom, prenom, competences, bio, cvUrl, req.user.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: 'Profil mis à jour !', cv_url: cvUrl });
    });
});

// 4. OFFRES DE STAGE
app.get('/api/offers', (req, res) => {
    const search = req.query.search ? `%${req.query.search}%` : '%';
    const sql = `
        SELECT o.*, c.nom_entreprise 
        FROM internship_offers o 
        JOIN company_profiles c ON o.company_id = c.id 
        WHERE o.titre LIKE ? OR o.technologies_requises LIKE ? OR o.localisation LIKE ?
        ORDER BY o.created_at DESC
    `;
    db.query(sql, [search, search, search], (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
});

app.post('/api/offers', verifyToken, (req, res) => {
    if (req.user.role !== 'ENTREPRISE') return res.status(403).json({ message: 'Réservé aux entreprises' });
    const { titre, description, technologies_requises, duree, localisation } = req.body;

    db.query('SELECT id FROM company_profiles WHERE user_id = ?', [req.user.id], (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ message: 'Profil entreprise introuvable' });
        const companyId = results[0].id;

        const sql = 'INSERT INTO internship_offers (company_id, titre, description, technologies_requises, duree, localisation) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(sql, [companyId, titre, description, technologies_requises, duree, localisation], (err2) => {
            if (err2) return res.status(500).json({ message: err2.message });
            res.status(201).json({ message: 'Offre publiée avec succès !' });
        });
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur demarre sur http://localhost:${PORT}`);
});