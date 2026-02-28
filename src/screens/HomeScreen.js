import React, { useContext, useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { UserContext } from '../context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const CATEGORY_COLORS = {
    "Infrastruktura": { pin: 'red', ui: '#DC3545' },
    "Czystość i Środowisko": { pin: 'green', ui: '#28A745' },
    "Transport Miejski": { pin: 'blue', ui: '#007BFF' },
    "Wandalizm i Bezpieczeństwo": { pin: 'purple', ui: '#6F42C1' },
    "Zieleń i Przestrzeń": { pin: 'yellow', ui: '#FFC107' },
    "Inne": { pin: 'gray', ui: '#6C757D' },
};
const ALL_CATEGORY = "Wszystkie";
const DEFAULT_LOCATION = {
    latitude: 51.7620,
    longitude: 19.4570,
};

// Funkcja Haversine do obliczania odległości
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Promień Ziemi w km
    const toRad = (value) => (value * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Odległość w km
};


export default function HomeScreen() {
    const { reports } = useContext(UserContext);
    const safeReports = Array.isArray(reports) ? reports : [];

    const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
    const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
    const [isNearbyFilterActive, setIsNearbyFilterActive] = useState(false);

    // --- Efekt do pobierania lokalizacji użytkownika ---
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Brak uprawnień do lokalizacji. Używam domyślnych koordynatów.');
                return;
            }

            try {
                let location = await Location.getCurrentPositionAsync({});
                setUserLocation({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });
            } catch (error) {
                console.error("Błąd pobierania lokalizacji:", error);
                // Utrzymaj domyślną lokalizację w przypadku błędu
            }
        })();
    }, []);

    // --- Memoizowana lista filtrowanych raportów ---
    const filteredReports = useMemo(() => {
        let reportsToFilter = safeReports;

        // 1. Filtr odległości (Nearby Filter - 1 km)
        if (isNearbyFilterActive && userLocation) {
            reportsToFilter = reportsToFilter.filter(report => {
                // Weryfikacja i parsowanie koordynatów
                const lat = Number.isFinite(report.lat) ? report.lat : parseFloat(report.lat);
                const lng = Number.isFinite(report.long) ? report.long : parseFloat(report.long);

                if (isNaN(lat) || isNaN(lng) || !userLocation.latitude) return false;

                const distance = haversineDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    lat,
                    lng
                );
                return distance <= 1; // 1 km
            });
        }

        // 2. Filtr kategorii (Category Filter)
        if (activeCategory !== ALL_CATEGORY) {
            reportsToFilter = reportsToFilter.filter(report => report.category === activeCategory);
        }

        return reportsToFilter;
    }, [safeReports, activeCategory, isNearbyFilterActive, userLocation]);

    // --- Funkcje pomocnicze do kolorów ---
    const getUiColor = (category) => CATEGORY_COLORS[category]?.ui || '#D4213D'; // Domyślnie czerwony
    const getPinColor = (category) => CATEGORY_COLORS[category]?.pin || 'red';

    // --- Obsługa filtrów ---
    const toggleNearbyFilter = () => {
        // Dodatkowa weryfikacja lokalizacji przy włączaniu filtra
        if (!isNearbyFilterActive && userLocation.latitude === DEFAULT_LOCATION.latitude) {
            Alert.alert("Lokalizacja niedostępna", "Nie udało się ustalić Twojej pozycji GPS. Spróbuj ponownie później.");
            return;
        }
        // Wyłączenie filtra kategorii, gdy aktywujemy Nearby
        if (!isNearbyFilterActive) {
            setActiveCategory(ALL_CATEGORY);
        }
        setIsNearbyFilterActive(prev => !prev);
    };

    const handleCategoryChange = (cat) => {
        // Wyłączenie filtra Nearby, gdy zmieniamy kategorię
        setIsNearbyFilterActive(false);
        setActiveCategory(cat);
    };


    // --- Renderowanie Komponentu ---
    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.025,
                    longitudeDelta: 0.025,
                }}
                // Kluczowe, aby mapa reagowała na aktualną pozycję (lub domyślną)
                region={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.025,
                    longitudeDelta: 0.025,
                }}
            >
                {/* Marker Lokalizacji Użytkownika */}
                {userLocation && userLocation.latitude !== DEFAULT_LOCATION.latitude && (
                    <Marker
                        coordinate={userLocation}
                        pinColor="green"
                        title="Twoja Lokalizacja"
                    />
                )}

                {/* Markery Zgłoszeń */}
                {filteredReports.map((report) => {
                    const lat = Number.isFinite(report.lat) ? report.lat : parseFloat(report.lat);
                    const lng = Number.isFinite(report.long) ? report.long : parseFloat(report.long);
                    const categoryName = String(report.category ?? 'Inne');
                    const title = String(report.title ?? report.issue ?? 'Zgłoszenie');
                    const description = String(report.description ?? report.category ?? 'Brak opisu.');

                    // Walidacja koordynatów przed renderowaniem
                    if (isNaN(lat) || isNaN(lng)) return null;

                    return (
                        <Marker
                            key={String(report.id)}
                            coordinate={{ latitude: lat, longitude: lng }}
                            pinColor={getPinColor(categoryName)}
                            title={title}
                            description={description}
                        />
                    );
                })}
            </MapView>

            {/* Kontener Filtrów (Chipy) */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                >
                    {/* CHIP 1: W promieniu 1 km */}
                    <TouchableOpacity
                        style={[
                            styles.chip,
                            isNearbyFilterActive && styles.chipActive,
                        ]}
                        onPress={toggleNearbyFilter}
                    >
                        <Ionicons 
                            name={isNearbyFilterActive ? "navigate-circle" : "location-outline"} 
                            size={14} 
                            color={isNearbyFilterActive ? 'white' : '#333'} 
                            style={{marginRight: 5}} 
                        />
                    <Text style={[styles.chipText, isNearbyFilterActive && styles.chipTextActive]}>
                        1 km ({
                            userLocation.latitude === DEFAULT_LOCATION.latitude
                                ? (isNearbyFilterActive ? filteredReports.length : '-')
                                : (isNearbyFilterActive 
                                    ? filteredReports.length 
                                    : safeReports.filter(r => 
                                        Number.isFinite(r.lat) && Number.isFinite(r.long) && 
                                        haversineDistance(userLocation.latitude, userLocation.longitude, r.lat, r.long) <= 1
                                    ).length
                                )
                        })
                    </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.chip,
                            activeCategory === ALL_CATEGORY && !isNearbyFilterActive && styles.chipActive,
                        ]}
                        onPress={() => handleCategoryChange(ALL_CATEGORY)}
                    >
                        <Ionicons 
                            name="filter-outline" 
                            size={14} 
                            color={activeCategory === ALL_CATEGORY && !isNearbyFilterActive ? 'white' : '#333'} 
                            style={{marginRight: 5}} 
                        />
                        <Text style={[styles.chipText, activeCategory === ALL_CATEGORY && !isNearbyFilterActive && styles.chipTextActive]}>
                            Wszystkie ({safeReports.length})
                        </Text>
                    </TouchableOpacity>

                    {Object.keys(CATEGORY_COLORS).map(cat => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => handleCategoryChange(cat)}
                            style={[
                                styles.chip,
                                activeCategory === cat && !isNearbyFilterActive && { 
                                    backgroundColor: getUiColor(cat),
                                },
                                activeCategory === cat && !isNearbyFilterActive && styles.chipActive, 
                            ]}
                        >
                            <Text style={[styles.chipText, activeCategory === cat && !isNearbyFilterActive && styles.chipTextActive]}>
                                {cat} ({safeReports.filter(r => r.category === cat).length})
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },

    filterContainer: {
        position: 'absolute',
        top: 60,
        width: '100%',
        paddingHorizontal: 10,
        zIndex: 10,
    },
    filterScroll: {
        paddingHorizontal: 5,
    },
    chip: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginRight: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        alignItems: 'center',
    },
    chipActive: {
        backgroundColor: '#D4213D',
    },
    chipText: {
        color: '#333',
        fontWeight: '500',
        fontSize: 12,
    },
    chipTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
});