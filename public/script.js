let authToken = '';

document.addEventListener('DOMContentLoaded', () => {
  // Check for token in localStorage
  authToken = localStorage.getItem('authToken');
  if (authToken) {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('recipeForm').style.display = 'block';
    fetchRecipes();
  }

  document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    registerUser(username, password);
  });

  document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    loginUser(username, password);
  });

  document.getElementById('recipeForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const title = document.getElementById('recipeTitle').value;
    const ingredients = document.getElementById('recipeIngredients').value;
    const instructions = document.getElementById('recipeInstructions').value;
    const category = document.getElementById('recipeCategory').value;
    const image = document.getElementById('recipeImage').files[0];

    addRecipe({ title, ingredients, instructions, category }, image);
  });

  document.getElementById('searchInput').addEventListener('input', function(event) {
    const query = event.target.value.toLowerCase();
    const recipes = document.querySelectorAll('#recipeList .list-group-item');
    recipes.forEach(recipe => {
      const text = recipe.querySelector('.recipe-title').innerText.toLowerCase();
      const category = recipe.querySelector('.recipe-category').innerText.toLowerCase();
      if (text.includes(query) || category.includes(query)) {
        recipe.style.display = '';
      } else {
        recipe.style.display = 'none';
      }
    });
  });
});

function registerUser(username, password) {
  fetch('/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.message) {
      showModal('Success', data.message);
      document.getElementById('registerUsername').value = '';
      document.getElementById('registerPassword').value = '';
      $('#login-tab').tab('show');
    } else {
      showModal('Error', data.message || 'Error registering user');
    }
  })
  .catch(error => showModal('Error', 'Error: ' + error.message));
}

function loginUser(username, password) {
  fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.token) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken); // Save token in localStorage
      showModal('Success', data.message);
      document.getElementById('authSection').style.display = 'none';
      document.getElementById('recipeForm').style.display = 'block';
      fetchRecipes();
    } else {
      showModal('Error', data.message || 'Invalid credentials');
    }
  })
  .catch(error => showModal('Error', 'Error: ' + error.message));
}

function fetchRecipes() {
  fetch('/recipes', {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  })
  .then(response => response.json())
  .then(data => {
    displayRecipes(data);
  })
  .catch(error => showModal('Error', 'Error: ' + error.message));
}

function addRecipe(recipe, image) {
  const formData = new FormData();
  formData.append('title', recipe.title);
  formData.append('ingredients', recipe.ingredients);
  formData.append('instructions', recipe.instructions);
  formData.append('category', recipe.category);
  if (image) {
    formData.append('image', image);
  }

  fetch('/recipes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  })
  .then(response => response.json().then(data => ({ status: response.status, body: data })))
  .then(data => {
    if (data.status === 201) {
      showModal('Success', data.body.message);
      fetchRecipes();
    } else {
      showModal('Error', data.body.message || 'Error adding recipe');
    }
  })
  .catch(error => showModal('Error', 'Error: ' + error.message));
}

function editRecipe(index, updatedRecipe) {
  const formData = new FormData();
  formData.append('title', updatedRecipe.title);
  formData.append('ingredients', updatedRecipe.ingredients);
  formData.append('instructions', updatedRecipe.instructions);
  formData.append('category', updatedRecipe.category);
  if (updatedRecipe.image) {
    formData.append('image', updatedRecipe.image);
  }

  fetch(`/recipes/${index}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData
  })
  .then(response => response.json().then(data => ({ status: response.status, body: data })))
  .then(data => {
    if (data.status === 200) {
      showModal('Success', data.body.message);
      fetchRecipes();
    } else {
      showModal('Error', data.body.message || 'Error updating recipe');
    }
  })
  .catch(error => showModal('Error', 'Error: ' + error.message));
}

function deleteRecipe(index) {
const recipeId = document.querySelectorAll('#recipeList .list-group-item')[index].getAttribute('data-id');

fetch(`/recipes/${recipeId}`, {
    method: 'DELETE',
    headers: {
    'Authorization': `Bearer ${authToken}`
    }
})
.then(response => response.json().then(data => ({ status: response.status, body: data })))
.then(data => {
    if (data.status === 200) {
    showModal('Success', data.body.message);
    fetchRecipes();
    } else {
    showModal('Error', data.body.message || 'Error deleting recipe');
    }
})
.catch(error => showModal('Error', 'Error: ' + error.message));
}
  


function displayRecipes(recipes) {
  const recipeList = document.getElementById('recipeList');
  recipeList.innerHTML = '';
  recipes.forEach((recipe, index) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.setAttribute('data-id', recipe._id);
    li.innerHTML = `
      <div>
        <h5 class="recipe-title">${recipe.title}</h5>
        <p class="recipe-category"><em>${recipe.category}</em></p>
        <p class="recipe-ingredients">${recipe.ingredients}</p>
        <p class="recipe-instructions">${recipe.instructions}</p>
        ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" class="img-fluid">` : ''}
      </div>
      <div>
        <button class="btn btn-warning btn-sm mr-2" onclick="editRecipePrompt(${index})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteRecipe(${index})">Delete</button>
      </div>
    `;
    recipeList.appendChild(li);
  });
}

function editRecipePrompt(index) {
  const title = prompt('Edit title:');
  const ingredients = prompt('Edit ingredients:');
  const instructions = prompt('Edit instructions:');
  const category = prompt('Edit category (Appetizer, Main Course, Dessert, Beverage):');
  if (title && ingredients && instructions && category) {
    editRecipe(index, { title, ingredients, instructions, category });
  }
}

function showModal(title, message) {
  document.getElementById('modalTitle').innerText = title;
  document.getElementById('modalBody').innerText = message;
  $('#notificationModal').modal('show');
}
