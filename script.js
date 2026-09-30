
const API_KEY = "42b7027c8457f4fff128017cac35dce0";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const weatherCard = document.getElementById("weatherCard");
const forecast = document.getElementById("forecast");
const forecastSection = document.getElementById("forecastSection");
const loading = document.getElementById("loading");
const errorMsg = document.getElementById("errorMsg");
const favoritesList = document.getElementById("favoritesList");
const favoriteBtn = document.getElementById("favoriteBtn");
const themeBtn = document.getElementById("themeBtn");
const suggestions = document.getElementById("suggestions");

let currentCity = "";
let debounceTimer;

async function getWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("City not found. Please enter a valid city.");
        }

        if (response.status === 401) {
            throw new Error("Invalid API key.");
        }

        throw new Error("Unable to fetch weather data.");
    }

    const data = await response.json();

    return {
        city: data.name,
        country: data.sys.country,
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed
    };
}
async function getForecast(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Unable to fetch forecast.");
    }
    const data = await response.json();
    const dailyForecast = [];
     for (let i = 0; i < data.list.length; i += 8) {
        const item = data.list[i];
        dailyForecast.push({
            date: new Date(item.dt * 1000),
            temp: Math.round(item.main.temp),
            description: item.weather[0].description,
            icon: item.weather[0].icon
        });

        if (dailyForecast.length === 5) {
            break;
        }
    }

    return dailyForecast;
}
async function searchWeather(city) {
    city = city.trim();

    if (!city) {
        showError("Please enter a city name.");
        return;
    }

    hideError();
    hideSuggestions();
    showLoading();

    try {
        const [weatherData, forecastData] = await Promise.all([
            getWeather(city),
            getForecast(city)
        ]);

        currentCity = weatherData.city;

        displayWeather(weatherData);
        displayForecast(forecastData);
    } catch (error) {
        showError(error.message);
        weatherCard.style.display = "none";
        forecastSection.style.display = "none";
    } finally {
        hideLoading();
    }
}

function displayWeather(data) {
    document.getElementById("cityName").textContent =
        `${data.city}, ${data.country}`;

    document.getElementById("weatherDescription").textContent =
        data.description;

    document.getElementById("temperature").textContent =
        `${data.temp}°C`;

    document.getElementById("feelsLike").textContent =
        `${data.feelsLike}°C`;

    document.getElementById("humidity").textContent =
        `${data.humidity}%`;

    document.getElementById("windSpeed").textContent =
        `${data.windSpeed} m/s`;

    document.getElementById("detailTemp").textContent =
        `${data.temp}°C`;

    weatherCard.style.display = "block";
}




function displayForecast(data) {
    forecast.innerHTML = "";

    data.forEach(day => {
        const card = document.createElement("div");

        card.className = "forecast-card";

        const date = day.date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric"
        });

        card.innerHTML = `
            <h4>${date}</h4>
            <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}">
            <div class="forecast-temp">${day.temp}°C</div>
            <div class="forecast-desc">${day.description}</div>
        `;

        forecast.appendChild(card);
    });

    forecastSection.style.display = "block";
}
function addFavorite(city) {
    let favorites =
        JSON.parse(localStorage.getItem("favorites")) || [];

    const exists = favorites.some(
        favorite =>
            favorite.toLowerCase() === city.toLowerCase()
    );

    if (exists) {
        showError("This city is already in your favorites.");
        return;
    }

    favorites.push(city);

    localStorage.setItem(
        "favorites",
        JSON.stringify(favorites)
    );

    loadFavorites();
}

function removeFavorite(city) {
    let favorites =
        JSON.parse(localStorage.getItem("favorites")) || [];

    favorites = favorites.filter(
        favorite =>
            favorite.toLowerCase() !== city.toLowerCase()
    );

    localStorage.setItem(
        "favorites",
        JSON.stringify(favorites)
    );

    loadFavorites();
}

function loadFavorites() {
    const favorites =
        JSON.parse(localStorage.getItem("favorites")) || [];

    favoritesList.innerHTML = "";

    if (favorites.length === 0) {
        favoritesList.innerHTML =
            `<p class="empty-favorites">No favorite cities yet.</p>`;
        return;
    }

    favorites.forEach(city => {
        const item = document.createElement("div");

        item.className = "favorite-item";

        const cityButton = document.createElement("button");

        cityButton.className = "favorite-city";
        cityButton.textContent = `📍 ${city}`;

        cityButton.addEventListener("click", () => {
            cityInput.value = city;
            searchWeather(city);
        });

        const removeButton = document.createElement("button");

        removeButton.className = "remove-favorite";
        removeButton.textContent = "×";

        removeButton.addEventListener("click", () => {
            removeFavorite(city);
        });

        item.appendChild(cityButton);
        item.appendChild(removeButton);

        favoritesList.appendChild(item);
    });
}

function debounceSearch() {
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
        const city = cityInput.value.trim();

        if (city.length >= 3) {
            showSuggestions(city);
        } else {
            hideSuggestions();
        }
    }, 500);
}

const popularCities = [
    "London",
    "New York",
    "Tokyo",
    "Dubai",
    "Mumbai",
    "Delhi",
    "Kozhikode",
    "Kochi",
    "Bengaluru",
    "Chennai",
    "Paris",
    "Singapore",
    "kannur",
    "malappuram",
    "tanur"
];

function showSuggestions(value) {
    const matches = popularCities.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
    );

    suggestions.innerHTML = "";

    if (matches.length === 0) {
        hideSuggestions();
        return;
    }

    matches.forEach(city => {
        const item = document.createElement("div");

        item.className = "suggestion";
        item.textContent = city;

        item.addEventListener("click", () => {
            cityInput.value = city;
            hideSuggestions();
            searchWeather(city);
        });

        suggestions.appendChild(item);
    });

    suggestions.style.display = "block";
}

function hideSuggestions() {
    suggestions.style.display = "none";
}

function showLoading() {
    loading.style.display = "block";
}

function hideLoading() {
    loading.style.display = "none";
}

function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.display = "block";
}

function hideError() {
    errorMsg.style.display = "none";
}

function toggleTheme() {
    document.body.classList.toggle("dark");

    const isDark =
        document.body.classList.contains("dark");

    themeBtn.textContent =
        isDark ? "☀️ Light" : "🌙 Dark";

    localStorage.setItem(
        "theme",
        isDark ? "dark" : "light"
    );
}

function loadTheme() {
    const savedTheme =
        localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeBtn.textContent = "☀️ Light";
    }
}

searchBtn.addEventListener("click", () => {
    searchWeather(cityInput.value);
});

cityInput.addEventListener(
    "input",
    debounceSearch
);

cityInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        searchWeather(cityInput.value);
    }
});

favoriteBtn.addEventListener("click", () => {
    if (currentCity) {
        addFavorite(currentCity);
    }
});

themeBtn.addEventListener(
    "click",
    toggleTheme
);

document.addEventListener("click", event => {
    if (!event.target.closest(".search-section")) {
        hideSuggestions();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    loadFavorites();
    loadTheme();
});
