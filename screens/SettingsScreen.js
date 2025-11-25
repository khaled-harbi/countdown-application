import React, { useContext } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AppContext } from '../App';
import { getAuth, signOut } from 'firebase/auth';

const SettingsScreen = ({ navigation }) => {
  const { isDarkMode, setIsDarkMode, notificationsEnabled, setNotificationsEnabled } =
    useContext(AppContext);

    const handleSignOut = () => {
      const auth = getAuth();
      signOut(auth)
        .then(() => {
          Alert.alert('Signed Out', 'You have been signed out successfully.');
          
        })
        .catch((error) => {
          Alert.alert('Error', error.message);
        });
    };       

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Text style={[styles.title, isDarkMode && styles.darkText]}>Settings</Text>

      {/* Dark Mode Toggle */}
      <View style={styles.row}>
        <Text style={[styles.label, isDarkMode && styles.darkText]}>Dark Mode</Text>
        <Switch
          value={isDarkMode}
          onValueChange={(value) => setIsDarkMode(value)}
          thumbColor={isDarkMode ? '#fff' : '#000'}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
        />
      </View>

      {/* Notifications Toggle */}
      <View style={styles.row}>
        <Text style={[styles.label, isDarkMode && styles.darkText]}>Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={(value) => setNotificationsEnabled(value)}
          thumbColor={notificationsEnabled ? '#fff' : '#000'}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
        />
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#222',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  darkText: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  label: {
    fontSize: 18,
  },
  signOutButton: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
