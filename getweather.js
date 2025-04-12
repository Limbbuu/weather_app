// getweather.js

//async funktio joka hakee säätiedot API:sta, oletuslokaatio VAMK

async function fetchWeather(lat = 63.1066, lon = 21.5919) {
                    //määritellään Open-meteo APi address from VAMK koordinates (lisättynä hourly parametrit jotta saa UV-indeksin)
    const apiURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=uv_index,temperature_2m,weathercode,precipitation,precipitation_probability`;

    try {
        // tehdään API kutsu
        const response = await fetch(apiURL);

        //jos vastaus ei oo OK, nii antaa virheilmon
        if (!response.ok) {
            throw new Error(`Verkkovirhe: ${response.status}`);
        }

        //muutetaan vastaus JSON-muotoon
        const data = await response.json();

        //tulostetaan haettu data konsoliin
        console.log("Haettu data:", data);

        //haetaan tämänhetkisen säätiedot
        const weather = data.current_weather;
        console.log("Nykyiset säätiedot:", weather);

        //muunnetaan aikaleima Suomen aikaan ja lisätään 2-3h (kesä/talviaika)
        const date = new Date(weather.time);
        date.setHours(date.getHours() + 3);
        const finnishTime = date.toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' });

        //hae UV-indeksi
        // Haetaan tämänhetkinen aika
        const now = new Date();
        const currentHour = now.toISOString().slice(0, 13); // esim. "2025-04-10T12"

        // Haetaan UV-indeksit ja niihin liittyvät kellonajat
        const uvTimes = data.hourly.time;
        const uvValues = data.hourly.uv_index;

        // Etsitään tämänhetkinen UV-arvo
        let uvNow = "ei saatavilla";
        const index = uvTimes.findIndex(t => t.startsWith(currentHour));
        if (index !== -1) {
            uvNow = uvValues[index];

        }

        //uv-indeksille omat värikoodit
        let uvColor = "gray"; // oletusväri jos ei dataa

        if (uvNow !== "ei saatavilla") {
            if (uvNow < 3) {
                uvColor = "green"; // matala
            } else if (uvNow < 6) {
                uvColor = "orange"; // kohtalainen
            } else if (uvNow < 8) {
                uvColor = "orangered"; // korkea
            } else if (uvNow < 11) {
                uvColor = "red"; // erittäin korkea
            } else {
                uvColor = "purple"; // äärimmäinen
            }
        }
        //lokalstorage, näyttää viimeisimmän lämpötilan
        localStorage.setItem('latestTemperature', weather.temperature);

        // Haetaan säätä kuvaava symboli
        const weatherSymbol = getWeatherIcon(weather.weathercode);


        //päivitetään kortin sisältö bootstrapin mukaisesti
        const weatherDiv = document.getElementById('weather');
        weatherDiv.innerHTML = `
            <div class="card-body">
            <h5 class="card-title">Nykyiset säätiedot ${weatherSymbol} </h5>
            <p class="card-text">
                <strong> Aika: </strong> ${finnishTime}<br>
                <strong> Lämpötila: </strong> ${weather.temperature} &deg;C <br> 
                <strong> Tuulen nopeus: </strong> ${weather.windspeed} m/s <br>
                <strong> Tuulen suunta: </strong> ${weather.winddirection} &deg <br>
                <strong> UV-indeksi: </strong> <span style="color:${uvColor}; font-weight:bold;">${uvNow}</span>
            </p>
            </div>
        `;

         // Ennuste seuraaville tunneille
         const hourlyTime = data.hourly.time;
         const hourlyTemp = data.hourly.temperature_2m;
         const hourlyCode = data.hourly.weathercode;
         const hourlyPrecip = data.hourly.precipitation;
         const hourlyPrecipProb = data.hourly.precipitation_probability;
 
         let forecastHTML = '<h6>Ennuste seuraaville tunneille:</h6><div class="row row row-cols-md-6">';
 
         const nowISO = now.toISOString().slice(0, 13);
         const startIndex = hourlyTime.findIndex(t => t > nowISO);
 
         for (let i = startIndex; i < startIndex + 5; i++) {
             if (i >= hourlyTime.length) break;
             const hour = new Date(hourlyTime[i]).getHours();
             const temp = hourlyTemp[i];
             const code = hourlyCode[i];
             const icon = getWeatherIcon(code);
             const precip = hourlyPrecip[i];
             const precipProb = hourlyPrecipProb[i];
 
             forecastHTML += `
                 <div class="col text-center mb-2">
                     <div>${hour}:00</div>
                     <div style="font-size: 1.5em;">${icon}</div>
                     <div>${temp}°C</div>
                     <div><small>💧${precip} mm </small></div>
                     <div><small>☂️${precipProb} % </small></div>
                 </div>`;
         }
 
         forecastHTML += '</div>';
         weatherDiv.innerHTML += forecastHTML;

    } catch (error) {

        //virhekäsittely, tulostetaan virhe consoleen ja näytetään se kortissa
        console.error("Virhe haussa:", error);
        document.getElementById('weather').innerHTML = `
            <div class="card-body">
                <h5 class="card-title"> Virhe </h5>
                <p class="card-text"> Virhe haussa: ${error} </p>
            </div>
        `;
    };
}


//funktio jossa apista haettu "sääkoodi" vastaa tiettyä ikonia
function getWeatherIcon(code) {
    const icons = {
        0: "☀️",   // Selkeää
        1: "🌤️",  // Enimmäkseen selkeää
        2: "⛅",   // Puolipilvistä
        3: "☁️",   // Pilvistä
        45: "🌫️",  // Sumu
        48: "🌫️",  // Sumu ja kuura
        51: "🌦️",  // Heikko tihkusade
        53: "🌦️",  // Keskivahva tihkusade
        55: "🌧️",  // Voimakas tihkusade
        61: "🌦️",  // Kevyt sade
        63: "🌧️",  // Keskivahva sade
        65: "🌧️",  // Voimakas sade
        71: "🌨️",  // Heikko lumisade
        73: "🌨️",  // Keskivahva lumisade
        75: "❄️",  // Voimakas lumisade
        80: "🌧️",  // Kevyt sadekuuro
        81: "🌧️",  // Sadekuuro
        82: "🌧️",  // Voimakas sadekuuro
        95: "⛈️",  // Ukkonen
        96: "⛈️",  // Ukkonen ja rakeet
        99: "⛈️"   // Voimakas ukkonen ja rakeet
    };
    return icons[code] || "❔"; // jos koodi tuntematon
}



// Käyttäjän valinnat napista (lista tai omat koordinaatit)
document.getElementById('getWeatherBtn').addEventListener('click', () => {

    //valitut tai syötetyt arvot haetaan
    //lista
    const select = document.getElementById('locationSelect'); 

    //omat koordinaatit
    const latInput = document.getElementById('latitude').value; 
    const lonInput = document.getElementById('longitude').value;

    //koordinatti muuttujat
    let lat, lon;

    // Tarkistetaan valitsiko käyttäjä listasta vai syöttikö arvot itse
    if (select.value) {

        //jos listasta niin pilkotaan arvo lat ja lon arvoiksi ja tallennetaan niihin
        [lat, lon] = select.value.split(',');
    } 
        //jos omat koordit textkenttä parsetaan numeroksi ja tallennetaan lat ja lon
    else if (latInput && lonInput) {
        lat = parseFloat(latInput);
        lon = parseFloat(lonInput);
    } 
        //jos ei valita mitään ja haetaan säätä niin ilmoitus ja "lopetetaan toiminto"
    else {
        alert('Valitse paikkakunta tai syötä koordinaatit!');
        return;
    }

    fetchWeather(lat, lon);

});

//päivitysnappi säälle, mutta oletuslokaatio on kokoajan VAMK
document.getElementById('refreshBtn').addEventListener('click', () => {
    fetchWeather();
});


//kutsutaan funktiota heti sivun latauduttua
fetchWeather();

//1min välein hakee datan, mut näkyy ruuudlla vasta 15min välein (konsolissa toki päivittyy 5min välein)
setInterval(fetchWeather, 300000); 
