require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('./models/User');
const Recipe = require('./models/Recipe');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect('mongodb://localhost:27017/recipeBook');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// User registration
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// User login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Create a new recipe
app.post('/recipes', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, ingredients, instructions, category } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const recipe = new Recipe({ title, ingredients, instructions, category, image, user: req.user.userId });
    await recipe.save();
    res.status(201).json({ message: 'Recipe added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding recipe', error: error.message });
  }
});

// Get all recipes
app.get('/recipes', async (req, res) => {
  try {
    const recipes = await Recipe.find().populate('user', 'username');
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recipes', error: error.message });
  }
});

// Get recipes by category
app.get('/recipes/category/:category', async (req, res) => {
  try {
    const recipes = await Recipe.find({ category: req.params.category }).populate('user', 'username');
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recipes by category', error: error.message });
  }
});

// Update a recipe
app.put('/recipes/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, ingredients, instructions, category } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const recipe = await Recipe.findById(req.params.id);
    if (recipe.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    recipe.title = title;
    recipe.ingredients = ingredients;
    recipe.instructions = instructions;
    recipe.category = category;
    if (image) recipe.image = image;
    await recipe.save();
    res.json({ message: 'Recipe updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating recipe', error: error.message });
  }
});

// Delete a recipe
app.delete('/recipes/:id', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    if (recipe.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await recipe.remove();
    res.json({ message: 'Recipe removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting recipe', error: error.message });
  }
});
app.delete('/recipes/:id', auth, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
        console.error('Recipe not found');
        return res.status(404).json({ message: 'Recipe not found' });
        }
        if (recipe.user.toString() !== req.user.userId) {
        console.error('Not authorized');
        return res.status(403).json({ message: 'Not authorized' });
        }
        await recipe.remove();
        res.json({ message: 'Recipe removed successfully' });
    } catch (error) {
        console.error('Error deleting recipe', error);
        res.status(500).json({ message: 'Error deleting recipe', error: error.message });
    }
});

  

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
