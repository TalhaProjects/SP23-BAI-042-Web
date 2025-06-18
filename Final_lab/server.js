const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const Product = require('./Model/Product');
const User = require('./Model/User');
const expressLayouts = require('express-ejs-layouts');
const Cart = require('./Model/Cart');



mongoose.connect('mongodb://localhost:27017/talha', {
   
})
.then(() => console.log('MongoDB connected to database: talha'))
.catch(err => console.error('Connection error:', err));

// Session configuration with explicit database name
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: 'mongodb://localhost:27017/talha',
        collectionName: 'sessions' 
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 
    }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
// Middleware to parse URL-encoded bodies and JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware to make user available to all templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Routes
app.get('/', (req, res) => {
    res.render('home');
});

// About Us routes (handle both patterns)
app.get('/about_us', (req, res) => {
    res.render('aboutus');
});

app.get('/aboutus', (req, res) => {
    res.render('aboutus');
});

// Product route (now public)
app.get('/product', async (req, res) => {
    try {
        const products = await Product.find({});
        res.render('product', { products });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Add to cart route
app.post('/cart/add', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { productId } = req.body;

    try {
        let cart = await Cart.findOne({ userId: req.session.user.id });

        if (!cart) {
            cart = new Cart({ userId: req.session.user.id, items: [] });
        }

        const existingItem = cart.items.find(item => item.product.toString() === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.items.push({ product: productId, quantity: 1 });
        }

        await cart.save();
        res.redirect('/cart');
    } catch (err) {
        console.error('Error adding to cart:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/cart', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const cart = await Cart.findOne({ userId: req.session.user.id }).populate('items.product');
        console.log('Cart:', cart);
        res.render('cart', { cart, layout: false });
    } catch (err) {
        console.error('Error retrieving cart:', err);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/admin/dashboard', isAdmin, (req, res) => {
    res.render('dashboard', { user: req.session.user, layout: 'layout' });
});

// Authentication routes
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login');
});

app.post('/login', async (req, res) => {
    try {
        const { email, password, adminLogin } = req.body;

        const user = await User.findOne({ email });
        
        if (!user) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid email or password' });
        }
        if (adminLogin === 'on' && !user.isAdmin) {
            return res.render('login', { error: 'You are not authorized as admin' });
        }

        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin
        };
        if (adminLogin === 'on' && user.isAdmin) {
            return res.redirect('/admin/dashboard');
        } else {
            return res.redirect('/');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'An error occurred during login' });
    }
});


app.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('register');
});

app.post('/register', async (req, res) => {
    try {
        const { username, email, password, isAdmin } = req.body;
        
        // Check if user already exists  
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.render('register', { error: 'Username or email already exists' });
        }

        // Create new user
        const user = new User({ username, email, password, isAdmin: isAdmin === 'on' });
        await user.save();
        
        if (user.isAdmin) {
            // Do not log admin in immediately — send to login page
            return res.redirect('/login');
        }

        // Log the user in
        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin
        };
        
            return res.redirect('/');
        
        
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', { error: 'An error occurred during registration' });
    }
});

app.post('/cart/remove/:productId', async (req, res) => {
    try {
        const userId = req.session.user.id;
        const productId = req.params.productId;

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.redirect('/cart');
        }

        // Remove the item by productId
        cart.items = cart.items.filter(item => item.product.toString() !== productId);

        await cart.save();
        res.redirect('/cart');
    } catch (err) {
        console.error('Error removing item from cart:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/checkout', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    try {
        res.render('checkout', { user: req.session.user });
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).send('Internal Server Error');
    }
    //await Cart.findOneAndDelete({ userId: req.session.user.id });
});

//admin panel routes

function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.isAdmin) return next();
    return res.status(403).send('Access Denied');
}

// Show all products
app.get('/admin/products', isAdmin, async (req, res) => {
    const products = await Product.find();
    res.render('admin-products', { products });
});

// Show add product form
app.get('/admin/products/add', isAdmin, (req, res) => {
    res.render('add-product');
});

// Handle product creation
app.post('/admin/products/add', isAdmin, async (req, res) => {
    const { name, price, description, image } = req.body;
    await Product.create({ name, price, description, image });
    res.redirect('/admin/products');
});

// Delete a product
app.post('/admin/products/delete/:id', isAdmin, async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin/products');
});

// View a single product
// View a single product (admin)
app.get('/admin/products/:id', isAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.render('adminProduct', { product });
    } catch (err) {
        console.error('Error fetching single product:', err);
        res.status(500).send('Server Error');
    }
});

// Show edit form
app.get('/admin/products/edit/:id', isAdmin, async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send('Product not found');
    res.render('edit-product', { product });
});

// Handle edit submission
app.post('/admin/products/edit/:id', isAdmin, async (req, res) => {
    const { name, price, description, image } = req.body;
    await Product.findByIdAndUpdate(req.params.id, { name, price, description, image });
    res.redirect('/admin/products');
});

//contact us route
const Complaint = require('./Model/Complaint');

// Middleware to protect user routes
function isLoggedIn(req, res, next) {
    if (req.session.user) return next();
    return res.redirect('/login');
}

// GET - Contact Us page
app.get('/contact', isLoggedIn, (req, res) => {
    res.render('contact'); // Create a contact.ejs page
});

// POST - Submit Complaint
app.post('/contact', isLoggedIn, async (req, res) => {
    const { orderId, message } = req.body;

    try {
        const complaint = new Complaint({
            userId: req.session.user.id,
            orderId,
            message
        });
        await complaint.save();
        res.redirect('/my-complaints');
    } catch (err) {
        console.error('Error submitting complaint:', err);
        res.status(500).send('Internal Server Error');
    }
});

// GET - View My Complaints
app.get('/my-complaints', isLoggedIn, async (req, res) => {
    try {
        const complaints = await Complaint.find({ userId: req.session.user.id }).sort({ createdAt: -1 });
        res.render('my-complaints', { complaints });
    } catch (err) {
        console.error('Error fetching complaints:', err);
        res.status(500).send('Internal Server Error');
    }
});

// GET - Admin View All Complaints
app.get('/admin/complaints', isAdmin, async (req, res) => {
    try {
        const complaints = await Complaint.find().populate('userId').sort({ createdAt: -1 });
        res.render('admin-complaints', { complaints });
    } catch (err) {
        console.error('Admin complaints view error:', err);
        res.status(500).send('Internal Server Error');
    }
});




app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
