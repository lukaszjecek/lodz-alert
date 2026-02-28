import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

const REWARDS = [
  {
    "id": 1,
    "title": "Bilet MPK 20 min (jednorazowy)",
    "cost": 50,
    "icon": "bus-outline"
  },
  {
    "id": 2,
    "title": "Godzina Parkowania (Strefa Płatna)",
    "cost": 100,
    "icon": "car-outline"
  },
    {
    "id": 3,
    "title": "Bilet MPK 60 min",
    "cost": 150,
    "icon": "train-outline"
  },
    {
    "id": 4,
    "title": "Voucher 10 zł do księgarni",
    "cost": 300,
    "icon": "book-outline"
  },
    {
    "id": 5,
    "title": "Wypożyczenie hulajnogi (30 min)",
    "cost": 400,
    "icon": "walk-outline"
  },
  {
    "id": 6,
    "title": "Darmowa Kawa (Partner A)",
    "cost": 500,
    "icon": "cafe-outline"
  },
      {
    "id": 9,
    "title": "Voucher 20 zł na Rower Miejski",
    "cost": 650,
    "icon": "bicycle-outline"
  },
  {
    "id": 10,
    "title": "Dobowy Bilet MPK",
    "cost": 700,
    "icon": "subway-outline"
  },
    {
    "id": 11,
    "title": "Darmowy wstęp do Centrum Nauki",
    "cost": 750,
    "icon": "flask-outline"
  },
  {
    "id": 12,
    "title": "Bilet do kina (jednorazowe)",
    "cost": 800,
    "icon": "videocam-outline"
  },
  {
    "id": 13,
    "title": "50% Zniżki na wejście do ZOO",
    "cost": 900,
    "icon": "paw-outline"
  },
  {
    "id": 14,
    "title": "Wsparcie schroniska",
    "cost": 1000,
    "icon": "heart-outline"
  }
];

export default function WalletScreen() {
  const { points, addPoints } = useContext(UserContext);
  
  const [qrVisible, setQrVisible] = useState(false);
  const [activeReward, setActiveReward] = useState(null);

  const handleRedeem = (reward) => {
    if (points >= reward.cost) {
      addPoints(
        -reward.cost,
        `Wymiana punktów na: ${reward.title}`
      );

      setActiveReward(reward);
      setQrVisible(true);
    } else {
      Alert.alert("Za mało punktów", `Brakuje Ci ${reward.cost - points} pkt. Zgłoś więcej usterek!`);
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Twój portfel</Text>
        <Text style={styles.pointsValue}>{points} pkt</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {REWARDS.map((reward) => (
          <TouchableOpacity 
            key={reward.id} 
            style={styles.card} 
            onPress={() => handleRedeem(reward)}
            disabled={points < reward.cost}
          >
            <View style={[styles.imagePlaceholder, points < reward.cost && styles.disabledPlaceholder]}>
              <Ionicons name={reward.icon} size={40} color="white" />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{reward.title}</Text>
              <Text style={styles.cardCost}>{reward.cost} pkt</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={qrVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ODBIERZ VOUCHER!</Text>
            <Text style={styles.modalSub}>Okaż ten kod partnerowi:</Text>
            
            {activeReward && (
              <Image 
                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=LODZ_HACK_${activeReward.id}_USER_123` }} 
                style={styles.qrImage} 
              />
            )}
            
            <Text style={styles.rewardName}>{activeReward?.title}</Text>

            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={() => setQrVisible(false)}
            >
              <Text style={styles.closeBtnText}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 5 },
  pointsValue: { fontSize: 32, fontWeight: 'bold', color: '#D4213D' },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15, paddingBottom: 20 },
  card: { 
    width: '42%', 
    aspectRatio: 1, 
    backgroundColor: 'white', 
    borderRadius: 20, 
    borderWidth: 2, 
    borderColor: '#00AEEF',
    overflow: 'hidden', 
    elevation: 3 
  },
  
  imagePlaceholder: { flex: 2, backgroundColor: '#00AEEF', justifyContent: 'center', alignItems: 'center' },
  disabledPlaceholder: { backgroundColor: '#ccc' },
  
  cardContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 5 },
  cardTitle: { fontWeight: 'bold', fontSize: 14, textAlign: 'center', marginBottom: 2 },
  cardCost: { color: '#666', fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 300, backgroundColor: 'white', borderRadius: 20, padding: 30, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#28a745', marginBottom: 10 },
  modalSub: { color: '#666', marginBottom: 20 },
  qrImage: { width: 200, height: 200, marginBottom: 20, resizeMode: 'contain' },
  rewardName: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  closeBtn: { backgroundColor: '#D4213D', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20 },
  closeBtnText: { color: 'white', fontWeight: 'bold' }
});