// 1. APPLICATION STATE
let state = {
    todos: [],
    filterWord: "",
    nextId: 1,
}

// 2. STATE ACCESSORS/MUTATORS FN'S
const savedState = localStorage.getItem('todoApp');
if (savedState) {
    state = JSON.parse(savedState);
}

fetch('https://dummyjson.com/todos?limit=3&skip=4')
    .then(res => res.json())
    .then(data => {
        state.todos = mergeTodos(state.todos, data.todos);
        saveState();
        render();
    })
    .catch(error => {
        console.error('Error fetching todos:', error);
    });

function saveState() {
    localStorage.setItem('todoApp', JSON.stringify(state));
}

function mergeTodos(existingTodos, fetchedTodos) {
    const existingTodoMap = new Map(existingTodos.map(todo => [todo.text, todo]));

    for (const fetchedTodo of fetchedTodos) {
        if (!existingTodoMap.has('fetched Todo: ' + fetchedTodo.todo)) {
            existingTodos.push({
                id: fetchedTodo.id,
                text: 'fetched Todo: ' + fetchedTodo.todo,
                completed: fetchedTodo.completed,
            });
        }
    }

    return existingTodos;
}

async function fetchedPlaceholders() {
    try {
        const response = await fetch('https://dummyjson.com/todos');
        const data = await response.json();

        const todos = data.todos.filter(todo => todo.todo.length <= 40);
        return todos.map(todo => ` ${todo.todo} `);
    } catch (error) {
        console.error('Error fetching placeholders:', error);
        return [' Write a todo here... ', ' What do you have to do this week? '];
    }
}

function filteredTodos() {
    const filterWord = state.filterWord.toUpperCase();
    const filteredTodos = [];
    for (const todo of state.todos) {
        const text = todo.text.toUpperCase();
        const startMatch = text.indexOf(filterWord);
        if (startMatch !== -1) {
            const endMatch = startMatch + filterWord.length;
            filteredTodos.push({ ...todo, startMatch, endMatch });
        }
    }
    return filteredTodos;
}

function filterWord(filterWord) {
    state.filterWord = filterWord;
}

function addTodo(text) {
    state.todos.push({ id: state.nextId, text: text, completed: false });
    state.nextId++;
}

function removeTodo(id) {
    let index = state.todos.findIndex(todo => todo.id === id);
    state.todos.splice(index, 1);
}

function removeAllTodos() {
    state.todos = [];
}

function toggleTodoCompleted(id) {
    const todo = state.todos.find(todo => todo.id === id);
    todo.completed = !todo.completed;
}

function calculateCompletionPercentage() {
    const totalTodos = state.todos.length;
    const completedTodos = state.todos.filter(todo => todo.completed).length;
    return totalTodos>0 ? Math.round((completedTodos/totalTodos)*100) : 0;
}

async function animatePlaceholder() {
    const placeholders = await fetchedPlaceholders();
    let currentIndex = 0;
    let currentText = '';
    let writing = true; // 1 -> writing, -1 -> deleting

    function updatePlaceholder() {
        if (writing) {
            currentText = placeholders[currentIndex].substring(0, currentText.length + 1);

            if (currentText === placeholders[currentIndex]) {
                writing = false;
                setTimeout(updatePlaceholder, 500);
            } else {
                todoInput$.placeholder = currentText;
                setTimeout(updatePlaceholder, 100);
            }

        } else if (!writing) {
            currentText = currentText.substring(0, currentText.length - 1);

            if (currentText === '') {
                writing = true;
                currentIndex = (currentIndex + 1) % placeholders.length;
                setTimeout(updatePlaceholder, 500);
            } else {
                todoInput$.placeholder = currentText;
                setTimeout(updatePlaceholder, 25);
            }
        }
    }
    updatePlaceholder();
}


// 3. DOM Node Refs
const todoAdd$ = document.querySelector("#todo-add");
const todoDeleteAll$ = document.querySelector('#todo-delete')
const todoInput$ = document.querySelector("#todo-input");
const todoList$ = document.querySelector("#todo-list");
const todoFilter$ = document.querySelector("#todo-filter");
const progressBar = document.querySelector('#progress-bar');

// 4. DOM Node Creation Fn's
function createTodoItem(todo) {
    const { editing, id, text, completed, startMatch, endMatch } = todo;
    const highlightedText = highlightFilterWord(text, startMatch, endMatch);
    return editing ? createTodoInputItem(todo) : createTodoSpanItem(todo, highlightedText);
}

function createTodoSpanItem(todo, highlightedText) {
    const { id, completed} = todo;
    return `
    <li class="list__li">
        ${createTodoCheckBox(id, completed)}
        <span class="span ${completed ? 'completed' : ''}">
            ${highlightedText}
        </span>
        ${createTodoEditButton(id)}
        ${createTodoDeleteButton(id)}
    </li>
    `;
}

function createTodoInputItem(todo) {
    const { id, text, completed } = todo;
    return `
    <li class="list__li">
        ${createTodoCheckBox(id, completed)}
        <input class="span input"
            value="${text}"
            onkeyup="onEditTodoKeyup(event, ${id})"
            onblur="onEditTodoBlur(event, ${id})">
    </li>
    `;
}

function highlightFilterWord(text, startMatch, endMatch) {
    const beforeMatch = text.slice(0, startMatch);
    const matchText = text.slice(startMatch, endMatch);
    const afterMatch = text.slice(endMatch);
    return `${beforeMatch}<mark>${matchText}</mark>${afterMatch}`;
}

function createTodoCheckBox(id, completed) {
    return `
    <input type="checkbox" ${completed ? 'checked' : ''}
      onclick="onCheckboxClick(${id})">
    `;
}

function createTodoEditButton(id) {
    return `
    <button class="edit-Button" onclick="onEditButtonClick(${id})">
        <img class="edit-Icon" src="./img/edit.png" alt="E">
    </button>
    `;
}

function createTodoDeleteButton(id) {
    return `
    <button class="delete-Button" onclick="onDeleteButtonClick(${id})">
      <img class="delete-Icon" src="./img/delete.png" alt="X">
    </button>
    `;
}

// 5. RENDER FN
function render() {
    todoList$.innerHTML = filteredTodos().map(createTodoItem).join('');
    saveState();
    renderProgressBar();
}

function renderProgressBar() {
    const completedPercentage = calculateCompletionPercentage();
    progressBar.style.width = `${completedPercentage}%`;
    progressBar.innerText = `${completedPercentage}%`;
}

// 6. EVENT HANDLERS
function onAddTodo() {
    const text = todoInput$.value;
    if (text.trim() !== '' && !text.startsWith('<')) {
        todoInput$.value = '';
        addTodo(text);
        render();
    }
}

function onDeleteButtonClick(id) {
    removeTodo(id);
    render();
}

function onEditButtonClick(id) {
    const todo = state.todos.find(todo => todo.id === id);
    todo.editing = true;
    render();
}

function onDeleteAllButtonClick() {
    removeAllTodos();
    render();
}

function onCheckboxClick(id) {
    toggleTodoCompleted(id);
    render();
}

function onFilterTodoChange() {
    filterWord(todoFilter$.value);
    render();
}

function onEditTodoKeyup(event, id) {
    if (event.key === 'Enter') {
        const text = event.target.value.trim();
        if (text !== '') {
            updateTodoText(id, text);
        } else {
            removeTodo(id);
        }
    }
}

function onEditTodoBlur(event, id) {
    const text = event.target.value.trim();
    if (text !== '') {
        updateTodoText(id, text);
    } else {
        removeTodo(id);
    }
}

function updateTodoText(id, newText) {
    const todo = state.todos.find(todo => todo.id === id);
    todo.text = newText;
    todo.editing = false;
    render();
}

// 7. INIT BINDINGS
todoAdd$.addEventListener('click', function () {
    onAddTodo();
});

todoInput$.addEventListener('keyup', function (event) {
    if (event.key === 'Enter') {
        onAddTodo();
    }
});

todoDeleteAll$.addEventListener('click', function () {
    onDeleteAllButtonClick();
})

todoFilter$.addEventListener('keyup', function () {
    onFilterTodoChange();
});

// 8. INITIAL RENDER
render();
animatePlaceholder();