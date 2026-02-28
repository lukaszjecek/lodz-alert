import Constants from 'expo-constants';

const GEMINI_API_KEY = Constants.expoConfig.extra.geminiApiKey;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGeminiAPI(contents, config = {}) {
    const body = {
        contents: contents.map(part => ({
            role: "user",
            parts: Array.isArray(part) ? part : [part],
        })),
        generationConfig: {
            responseMimeType: config.responseMimeType || "application/json",
            temperature: config.temperature ?? 0.1,
        },
    };

    const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return text.trim();
}

async function reverseGeocode(lat, long) {
    return `ul. Piotrkowska ${Math.floor(Math.random() * 100) + 1}, Łódź`;
}

function base64ToInlineData(base64Image, mimeType = "image/jpeg") {
    return {
        inlineData: {
            mimeType,
            data: base64Image,
        },
    };
}

export async function analyzeImage(base64Image, coords) {
    if (!base64Image) {
        throw new Error("Brak obrazu do analizy.");
    }
    const address = await reverseGeocode(coords.lat, coords.long);

    const cleanBase64Image = base64Image.includes(",")
        ? base64Image.split(",").pop()
        : base64Image;

    const parts = [
        base64ToInlineData(cleanBase64Image, "image/jpeg"),
        {
            text: `Jesteś asystentem miejskim w Łodzi. Przeanalizuj to zdjęcie problemu zlokalizowanego przy ${address}. Zidentyfikuj problem i skategoryzuj go. Na podstawie problemu, oceń jego krytyczność (urgency_score) i zasugeruj zarząd, do którego ma trafić (assigned_to).

Kategorie, których masz używać (tylko jedna z listy): Infrastruktura, Czystość i Środowisko, Transport Miejski, Wandalizm i Bezpieczeństwo, Zieleń i Przestrzeń, Inne.
Zasugerowane zarządy: Zarząd Dróg i Transportu, Wydział Ochrony Środowiska, Zarząd Zieleni Miejskiej, Wydział Bezpieczeństwa.

Odpowiedz TYLKO czystym JSONem w formacie: { 
    "issue": "Krótki tytuł", 
    "category": "Kategoria", 
    "points": [Liczba punktów 10-100], 
    "description": "Jedno zdanie opisu",
    "urgency_score": [Ocena krytyczności 1-100],
    "assigned_to": "Zasugerowany zarząd"
}.`,
        },
    ];

    try {
        const content = await callGeminiAPI([parts], {
            responseMimeType: "application/json",
            temperature: 0.1,
        });
        const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(cleanJson);
        return { ...data, address };
    } catch (error) {
        console.error("Błąd API Gemini:", error);
        throw new Error("Analiza obrazu przez AI nie powiodła się.");
    }
}

export async function generateFormalReport(category, rawDescription, coords) {
    const address = await reverseGeocode(coords.lat, coords.long);

    const parts = [
        {
            text: `Jesteś asystentem miejskim w Łodzi. Otrzymałeś zgłoszenie od mieszkańca o problemie z kategorii "${category}" zlokalizowanym przy ${address}. Poniżej znajduje się surowy opis od użytkownika.
            
Opis użytkownika: "${rawDescription}"

Twoim zadaniem jest przekształcenie tego w spójny, formalny i sensowny raport. Oszacuj również wartość punktową (od 10 do 50, im ważniejszy problem, tym więcej punktów), oceń jego krytyczność (urgency_score) i zasugeruj zarząd, do którego ma trafić (assigned_to).
Zasugerowane zarządy: Zarząd Dróg i Transportu, Wydział Ochrony Środowiska, Zarząd Zieleni Miejskiej, Wydział Bezpieczeństwa.

Odpowiedz TYLKO czystym JSONem w formacie: { 
    "issue": "Krótki formalny tytuł (3-5 słów)", 
    "points": [Liczba punktów 10-50], 
    "description": "Szczegółowy, formalny opis problemu, który jest gotowy do przekazania służbom miejskim.", 
    "urgency_score": [Ocena krytyczności 1-100],
    "assigned_to": "Zasugerowany zarząd"
}.`,
        },
    ];

    try {
        const content = await callGeminiAPI([parts], {
            responseMimeType: "application/json",
            temperature: 0.2,
        });
        const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();
        const report = JSON.parse(cleanJson);
        report.points = Math.max(10, Math.min(50, parseInt(report.points) || 10));
        return { ...report, address };
    } catch (error) {
        console.error("Błąd API Gemini:", error);
        throw new Error("Generowanie raportu przez AI nie powiodło się.");
    }
}

export async function generateTrafficAlert(description) {
    return { title: "Awaria Transportu", message: description, delay: "10-15 min" };
}
