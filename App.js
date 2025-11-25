import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { initializeApp } from '@firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from '@firebase/auth';
import * as Notifications from 'expo-notifications';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import AddTaskScreen from './screens/AddTaskScreen';
import EditTaskScreen from './screens/EditTaskScreen';
import { ScrollView, View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';


export const AppContext = createContext();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const scheduleNotificationsForTask = async (task, notificationsEnabled) => {
  if (!notificationsEnabled) return; // Skip if notifications are disabled

  const now = new Date();
  const taskDate = new Date(task.date);

  if (taskDate > now) {
    // 1 Day Left Notification
    const oneDayBefore = new Date(taskDate);
    oneDayBefore.setDate(taskDate.getDate() - 1);
    if (oneDayBefore > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Reminder: ${task.name}`,
          body: `Only 1 day left until your task is due!`,
        },
        trigger: oneDayBefore,
      });
    }

    // 1 Hour Left Notification
    const oneHourBefore = new Date(taskDate);
    oneHourBefore.setHours(taskDate.getHours() - 1);
    if (oneHourBefore > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Hurry Up: ${task.name}`,
          body: `Only 1 hour left until your task is due!`,
        },
        trigger: oneHourBefore,
      });
    }

    // Task Finished Notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Task Due: ${task.name}`,
        body: `Your task is now due. Make sure it's completed!`,
      },
      trigger: taskDate,
    });
  }
};

const HomeStack = () => {
  const { isDarkMode } = useContext(AppContext); // Access dark mode state

  return (
<Stack.Navigator
  screenOptions={{
    headerStyle: {
      backgroundColor: isDarkMode ? '#000' : '#fff', // Matches dark mode
    },
    headerTintColor: isDarkMode ? '#fff' : '#000', // Text and icon color
  }}
>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddTask"
        component={AddTaskScreen}
        options={{ title: 'Add Task' }}
      />
      <Stack.Screen
        name="EditTask"
        component={EditTaskScreen}
        options={{ title: 'Edit Task' }}
      />
    </Stack.Navigator>
  );
};


const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        console.log('Notification token:', token);
      }
    })();

    return () => unsubscribe();
  }, []);

  const handleAuthentication = async () => {
    try {
      if (user) {
        await signOut(auth);
        setUser(null);
      } else {
        if (isLogin) {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error.message);
    }
  };

  if (!user) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.title}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button
            title={isLogin ? 'Sign In' : 'Sign Up'}
            onPress={handleAuthentication}
            color="#3498db"
          />
          <Text
            style={styles.toggleText}
            onPress={() => setIsLogin(!isLogin)}
          >
            {isLogin
              ? 'Need an account? Sign Up'
              : 'Already have an account? Sign In'}
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <AppContext.Provider
      value={{
        isDarkMode,
        setIsDarkMode,
        notificationsEnabled,
        setNotificationsEnabled,
      }}
    >
<StatusBar
  barStyle="dark-content" // Always use black elements
  backgroundColor={isDarkMode ? '#fff' : '#fff'} 
  translucent={false} 
/>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: {
              backgroundColor: isDarkMode ? '#000' : '#fff',
            },
            tabBarActiveTintColor: isDarkMode ? '#fff' : '#000',
          }}
        >
          <Tab.Screen name="Home" component={HomeStack} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </AppContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  darkContainer: {
    backgroundColor: '#000', // Full dark background
  },
  darkText: {
    color: '#fff', // Light text for dark mode
  },
  taskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  authContainer: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 16,
    padding: 8,
    borderRadius: 4,
  },
  toggleText: {
    color: '#3498db',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default App;
