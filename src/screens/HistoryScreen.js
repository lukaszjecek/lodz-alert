import React, { useContext, useMemo } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserContext } from '../context/UserContext';

const STATUS_STYLES = {
    'OCZEKUJĄCY': { icon: 'hourglass-outline', color: '#6C757D' },
    'W TRAKCIE': { icon: 'settings-outline', color: '#00AEEF' },
    'ROZWIĄZANO': { icon: 'checkmark-circle-outline', color: '#28A745' },
};

const StatSummary = ({ icon, label, count, color }) => (
    <View style={styles.statSummary}>
        <Ionicons name={icon} size={30} color={color} />
        <Text style={[styles.statCount, { color }]}>{count}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

export default function HistoryScreen() {
    const { reports, points, transactions } = useContext(UserContext); 

    const stats = useMemo(() => {
    const safeReports = reports || [];
    const safeTransactions = transactions || [];

    const total = safeReports.length;
    const resolved = safeReports.filter(r => r.status === 'ROZWIĄZANO').length;
    const inProgress = safeReports.filter(r => r.status === 'W TRAKCIE').length;
    const pending = safeReports.filter(r => r.status === 'OCZEKUJĄCY').length;

    const totalEarned = safeTransactions
    .filter(t => t.type === 'EARNED')
    .reduce((sum, t) => sum + t.amount, 0);

    const totalRedeemed = safeTransactions
    .filter(t => t.type === 'REDEEMED')
    .reduce((sum, t) => sum + t.amount, 0);

    return { total, resolved, inProgress, pending, totalEarned, totalRedeemed };
}, [reports, transactions]);

    const sortedReports = useMemo(() => {
    const safeReports = reports || [];
    return [...safeReports].sort((a, b) => {
        return new Date(b.date.replace(/-/g, '/')) - new Date(a.date.replace(/-/g, '/'));
  });
}, [reports]);


    return (
        <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
        <Text style={styles.header}>Moja Aktywność</Text>

        <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Statystyki Działania</Text>
        <Text style={styles.statsSubTitle}>Łącznie zgłoszonych spraw: {stats.total}</Text>

        <View style={styles.summaryContainer}> 
        <StatSummary 
            icon="checkmark-circle-outline" 
            label="Rozwiązano" 
            count={stats.resolved} 
            color={STATUS_STYLES['ROZWIĄZANO'].color}
            />
            <StatSummary 
            icon="settings-outline" 
            label="W Trakcie" 
            count={stats.inProgress} 
            color={STATUS_STYLES['W TRAKCIE'].color}
            />
            <StatSummary 
            icon="hourglass-outline" 
            label="Oczekujące" 
            count={stats.pending} 
            color={STATUS_STYLES['OCZEKUJĄCY'].color}
            />

        </View>

        <Text style={styles.pointsInfo}>
            Aktualne punkty: <Text style={{fontWeight: 'bold', color: '#D4213D'}}>{points} pkt</Text>
        </Text>
        </View>
      
      <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Historia Punktów</Text>
          <View style={styles.pointsSummaryRow}>
              <Text style={styles.pointsTotalText}>Zdobyte: 
                  <Text style={{color: '#28A745', fontWeight: 'bold'}}> {stats.totalEarned} pkt</Text>
              </Text>
              <Text style={styles.pointsTotalText}>Wydane: 
                  <Text style={{color: '#D4213D', fontWeight: 'bold'}}> {Math.abs(stats.totalRedeemed)} pkt</Text>
              </Text>
          </View>
          {transactions && transactions.map((t) => (
              <View key={t.id} style={styles.transactionItem}>
                  <Ionicons 
                      name={t.type === 'EARNED' ? 'add-circle' : 'remove-circle'} 
                      size={24} 
                      color={t.type === 'EARNED' ? '#28A745' : '#D4213D'} 
                      style={{marginRight: 10}}
                  />
                  <View style={styles.reportContent}>
                      <Text style={styles.transactionDescription}>{t.description}</Text>
                      <Text style={styles.reportDetail}>{t.date}</Text>
                  </View>
                  <Text style={[
                      styles.transactionAmount, 
                      { color: t.type === 'EARNED' ? '#28A745' : '#D4213D' }
                  ]}>
                      {t.type === 'EARNED' ? `+${t.amount}` : `${t.amount}`} pkt
                  </Text>
              </View>
          ))}
      </View>

    <View style={[styles.listContainer, {marginTop: 25}]}>
        <Text style={styles.listTitle}>Historia Spraw</Text>
            {sortedReports.map((report) => {
            const statusStyle = STATUS_STYLES[report.status] || STATUS_STYLES['OCZEKUJĄCY'];
            return (
            <TouchableOpacity key={report.id} style={styles.reportItem}>
                <View style={[styles.statusIcon, { borderColor: statusStyle.color }]}>
                <Ionicons name={statusStyle.icon} size={24} color={statusStyle.color} />
                </View>
                <View style={styles.reportContent}>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportDetail}>{report.category} | {report.date}</Text>
                </View>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{report.status}</Text>
            </TouchableOpacity>
            );
        })}
    </View>
    </ScrollView>
 );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f0f0', paddingTop: 60, paddingHorizontal: 15 },
    header: { fontSize: 28, fontWeight: '800', color: '#333', marginBottom: 20 },
    statsCard: { backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 25, elevation: 3 },
    statsTitle: { fontSize: 20, fontWeight: 'bold', color: '#D4213D', marginBottom: 5 },
    statsSubTitle: { fontSize: 14, color: '#666', marginBottom: 20 },
    summaryContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
    statSummary: { alignItems: 'center', width: '30%' },
    statCount: { fontSize: 28, fontWeight: 'bold', marginTop: 5 },
    statLabel: { fontSize: 12, color: '#666', marginTop: 2, textAlign: 'center' },
    pointsInfo: { fontSize: 16, textAlign: 'center', marginTop: 10 },
    listContainer: { backgroundColor: 'white', borderRadius: 15, padding: 15, elevation: 3 },
    listTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
    
    pointsSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10
    },
    pointsTotalText: {
        fontSize: 14,
        color: '#333'
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    transactionDescription: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1
    },
    transactionAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 10
    },
    
    reportItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    statusIcon: { 
        borderWidth: 2, 
        borderRadius: 8, 
        padding: 5,
        marginRight: 15 
    },
    reportContent: { flex: 1 },
    reportTitle: { fontSize: 14, fontWeight: '600' },
    reportDetail: { fontSize: 10, color: '#999', marginTop: 3 },
    statusText: { fontWeight: 'bold', fontSize: 10, width: 80, textAlign: 'right' }
});