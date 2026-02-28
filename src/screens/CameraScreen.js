import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { UserContext } from "../context/UserContext";
import {
  analyzeImage,
  generateTrafficAlert,
  generateFormalReport,
} from "../services/aiService";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";

const CATEGORIES = [
  "Infrastruktura",
  "Czystość i Środowisko",
  "Transport Miejski",
  "Wandalizm i Bezpieczeństwo",
  "Zieleń i Przestrzeń",
  "Inne",
];

export default function CameraScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [locationCoords, setLocationCoords] = useState(null);
  const [textMode, setTextMode] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(null);
  const [line, setLine] = useState("");

  const { addPoints, addReport } = useContext(UserContext);
  const navigation = useNavigation();

  const getLocation = async () => {
    setLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Brak uprawnień",
        "Aby zgłosić problem, potrzebujemy dostępu do Twojej lokalizacji."
      );
      setLoading(false);
      return null;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coords = {
        lat: location.coords.latitude,
        long: location.coords.longitude,
      };
      setLocationCoords(coords);
      return coords;
    } catch (error) {
      Alert.alert(
        "Błąd lokalizacji",
        "Nie udało się pobrać aktualnej pozycji GPS."
      );
      setLoading(false);
      return null;
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return Alert.alert("Brak zgody na kamerę");
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.2,
      base64: true,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
      setResult(null);
      setTextMode(false);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);

    const coords = await getLocation();
    if (!coords) return;

    try {
      const data = await analyzeImage(image.base64, coords);
      setResult(data);
      if (data.points) {
        addPoints(data.points, `Punkty za zgłoszenie wizualne: ${data.issue}`);
        addReport(
          data.issue,
          data.category,
          data.points,
          coords.lat,
          coords.long,
          data.address,
          data.urgency_score,
          data.assigned_to
        );
      }
      Alert.alert("Sukces!", `Zgłoszenie ${data.issue} przyjęte.`);
      navigation.navigate("Mapa");
    } catch (error) {
      console.error("Błąd w handleAnalyze:", error);
      Alert.alert("Błąd", "Błąd AI. Sprawdź konsolę.");
    } finally {
      setLoading(false);
    }
  };

  const submitTextReport = async () => {
    if (!category) return Alert.alert("Uwaga", "Wybierz kategorię zgłoszenia.");
    if (category === "Transport Miejski" && !line)
      return Alert.alert("Uwaga", "Podaj numer linii.");
    if (!description) return Alert.alert("Uwaga", "Opisz problem.");
    setLoading(true);

    const coords = await getLocation();
    if (!coords) return;

    try {
      let aiResult = null;
      if (category === "Transport Miejski") {
        const alertData = await generateTrafficAlert(description);
        aiResult = {
          issue: alertData.title,
          category: category,
          points: 15,
          description: `${alertData.message}\n(Szacowane opóźnienie: ${alertData.delay})`,
          address: "Adres geokodowany (Transport)",
          urgency_score: 50,
          assigned_to: "Zarząd Dróg i Transportu",
        };
      } else {
        const reportData = await generateFormalReport(
          category,
          description,
          coords
        );

        aiResult = {
          issue: reportData.issue,
          category: category,
          points: reportData.points,
          description: reportData.description,
          address: reportData.address,
          urgency_score: reportData.urgency_score,
          assigned_to: reportData.assigned_to,
        };
      }

      setResult(aiResult);
      addPoints(
        aiResult.points,
        `Punkty za zgłoszenie tekstowe: ${aiResult.issue}`
      );
      addReport(
        aiResult.issue,
        aiResult.category,
        aiResult.points,
        coords.lat,
        coords.long,
        aiResult.address,
        aiResult.urgency_score,
        aiResult.assigned_to
      );
      Alert.alert("Sukces!", `Zgłoszenie ${aiResult.issue} przyjęte.`);
      navigation.navigate("Mapa");
    } catch (error) {
      console.error("Błąd w submitTextReport:", error);
      Alert.alert("Błąd", "Błąd przetwarzania AI. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setTextMode(false);
    setDescription("");
    setCategory(null);
    setLine("");
    setLocationCoords(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Zgłoś Problem</Text>

      {!textMode && (
        <View style={styles.imageCard}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera-outline" size={60} color="#ccc" />
              <Text style={styles.placeholderText}>Zrób zdjęcie usterki</Text>
            </View>
          )}
        </View>
      )}

      {textMode && !result && (
        <View style={styles.formCard}>
          <Text style={styles.label}>1. Czego dotyczy problem?</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  category === cat && styles.catChipSelected,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.catText,
                    category === cat && styles.catTextSelected,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {category === "Transport Miejski" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>2. Numer Linii:</Text>
              <TextInput
                style={styles.lineInput}
                placeholder="np. 11, 96, Z1"
                value={line}
                onChangeText={setLine}
                keyboardType="default"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {category === "Transport Miejski"
                ? "3. Gdzie stoi / Opis awarii:"
                : "2. Opis problemu:"}
            </Text>
            <TextInput
              style={styles.descInput}
              placeholder="Opisz krótko sytuację..."
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>
        </View>
      )}

      {loading && (
        <ActivityIndicator
          size="large"
          color="#D4213D"
          style={{ marginTop: 20 }}
        />
      )}

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Przyjęto zgłoszenie</Text>
          <Text style={styles.issueText}>{result.issue}</Text>
          {/* Poprawione wyświetlanie: Zagnieżdżony <Text> dla pogrubienia */}
          <View style={styles.metadataContainer}>
            <Text style={styles.metadataAddress}>
              <Text style={{ fontWeight: "bold" }}>Adres:</Text>{" "}
              {result.address || "Nieznany"}
            </Text>
            <Text style={styles.metadataUrgency}>
              <Text style={{ fontWeight: "bold" }}>Pilność:</Text>{" "}
              {result.urgency_score || "N/A"}/100
            </Text>
            <Text style={styles.metadataRoute}>
              <Text style={{ fontWeight: "bold" }}>Przekazano do:</Text>{" "}
              {result.assigned_to || "N/A"}
            </Text>
          </View>
          <Text style={styles.descText}>{result.description}</Text>
          <Text style={[styles.pointsBadge, { color: "#856404" }]}>
            +{result.points} PKT
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {!image && !textMode && !result && (
          <>
            <TouchableOpacity style={styles.btnPrimary} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color="white" />
              <Text style={[styles.btnText, { color: 'white' }]}>
                ZRÓB ZDJĘCIE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => setTextMode(true)}
            >
              <Ionicons name="create-outline" size={24} color="#D4213D" />
              <Text style={[styles.btnText, { color: "#D4213D" }]}>
                ZGŁOŚ OPISOWO
              </Text>
            </TouchableOpacity>
          </>
        )}

        {image && !result && !loading && (
          <TouchableOpacity style={styles.btnSuccess} onPress={handleAnalyze}>
            <Text style={[styles.btnText, { color: 'white' }]}>ANALIZUJ</Text>
          </TouchableOpacity>
        )}

        {textMode && !result && !loading && (
          <TouchableOpacity
            style={styles.btnSuccess}
            onPress={submitTextReport}
          >
            <Text style={[styles.btnText, { color: 'white' }]}>WYŚLIJ ZGŁOSZENIE</Text>
          </TouchableOpacity>
        )}

        {(image || result || textMode) && !loading && (
          <TouchableOpacity onPress={reset} style={{ marginTop: 20 }}>
            <Text style={{ color: "#666" }}>Anuluj / Wróć</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 120,
    paddingBottom: 40,
    backgroundColor: "#f8f9fa",
  },
  header: {
    fontSize: 26,
    fontWeight: "800",
    color: "#D4213D",
    marginBottom: 40,
  },

  imageCard: {
    width: 300,
    height: 300,
    backgroundColor: "white",
    borderRadius: 20,
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center" },
  placeholderText: { color: "#999", marginTop: 10 },

  formCard: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 3,
  },
  label: { fontWeight: "bold", marginBottom: 8, color: "#333", fontSize: 14 },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  catChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
    marginBottom: 8,
  },
  catChipSelected: { backgroundColor: "#D4213D" },
  catText: { color: "#555", fontSize: 12 },
  catTextSelected: { color: "white", fontWeight: "bold" },
  inputGroup: { marginBottom: 15 },
  lineInput: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    width: 100,
    textAlign: "center",
    fontWeight: "bold",
  },
  descInput: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 10,
    height: 80,
    textAlignVertical: "top",
  },

  actions: { marginTop: 30, width: "100%", alignItems: "center" },
  btnPrimary: {
    flexDirection: "row",
    backgroundColor: "#D4213D",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    elevation: 3,
    alignItems: "center",
    marginBottom: 15,
  },
  btnSecondary: {
    flexDirection: "row",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#D4213D",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 50,
    elevation: 0,
    alignItems: "center",
  },
  btnSuccess: {
    backgroundColor: "#28a745",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 50,
    elevation: 3,
  },
  btnText: { fontWeight: "bold", fontSize: 16, marginLeft: 10, color: 'white' },
  
  resultBox: {
    marginTop: 20,
    width: "85%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    elevation: 4,
    alignItems: "center",
  },
  resultTitle: { fontSize: 18, color: "#28a745", fontWeight: "bold" },
  issueText: { fontSize: 20, fontWeight: "bold", marginVertical: 5 },

  metadataContainer: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  metadataAddress: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
    fontWeight: "500",
  },
  metadataUrgency: {
    fontSize: 14,
    color: "#D4213D",
    fontWeight: "500",
    marginBottom: 4,
  },
  metadataRoute: {
    fontSize: 14,
    color: "#007BFF",
    fontWeight: "500",
  },
  descText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 10,
    paddingTop: 10,
  },

  pointsBadge: {
    backgroundColor: "#FFD700", 
    padding: 5,
    borderRadius: 5,
    fontWeight: "bold",
  },
});