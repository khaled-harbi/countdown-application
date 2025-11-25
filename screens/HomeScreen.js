import React, { useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { getFirestore, collection, getDocs, query, where, doc, deleteDoc, updateDoc } from '@firebase/firestore';
import { getAuth } from '@firebase/auth';
import { Swipeable } from 'react-native-gesture-handler';
import { AppContext } from '../App';

const HomeScreen = ({ navigation }) => {
  const { isDarkMode } = useContext(AppContext);
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const db = getFirestore();
  const auth = getAuth();
  const user = auth.currentUser;

  const fetchTasks = async () => {
    if (!user) return; // Ensure the user is logged in
    try {
      const q = query(collection(db, 'tasks'), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const fetchedTasks = [];
      querySnapshot.forEach((doc) => {
        const taskData = doc.data();
  
        
        if (!taskData.date || !doc.id) {
          console.warn('Task missing required fields:', doc.id, taskData);
          return; // Skip invalid task
        }
  
        const { timeLeftDisplay, formattedDate, repeatDisplay } = calculateTimeLeftAndDate({ ...taskData, id: doc.id });
        fetchedTasks.push({
          id: doc.id,
          name: taskData.name,
          date: taskData.date,
          allDay: taskData.allDay,
          repeat: taskData.repeat,
          timeLeftDisplay,
          formattedDate,
          repeatDisplay,
          color: taskData.color || '#f9f9f9', // Default color if not provided
        });
      });
  
      // Sort tasks by the date field (nearest first)
      fetchedTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
  
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
    }
  };
  

  const calculateTimeLeftAndDate = (taskData) => {
    if (!taskData || !taskData.date || !taskData.id) {
      console.error('Invalid task data:', taskData);
      return { timeLeftDisplay: 'Invalid Task', formattedDate: '', repeatDisplay: '' };
    }

    const now = new Date();
    let targetDate = new Date(taskData.date);

    if (taskData.allDay) {
      targetDate.setHours(23, 59, 59, 999);
    }

    if (targetDate <= now && taskData.repeat && taskData.repeat !== 'Off') {
      while (targetDate <= now) {
        switch (taskData.repeat) {
          case 'Daily':
            targetDate.setDate(targetDate.getDate() + 1);
            break;
          case 'Weekly':
            targetDate.setDate(targetDate.getDate() + 7);
            break;
          case 'Monthly':
            targetDate.setMonth(targetDate.getMonth() + 1);
            break;
          case 'Yearly':
            targetDate.setFullYear(targetDate.getFullYear() + 1);
            break;
          default:
            break;
        }
      }
      updateTaskDate(taskData.id, targetDate);
    }

    const diff = targetDate - now;

    if (diff <= 0) return { timeLeftDisplay: 'Overdue', formattedDate: '', repeatDisplay: taskData.repeat || '' };

    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const formattedDate = targetDate.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const repeatDisplay = taskData.repeat && taskData.repeat !== 'Off' ? taskData.repeat : '';

    if (days > 0) {
      return { timeLeftDisplay: `${days} days left`, formattedDate, repeatDisplay };
    }
    if (hours > 0) {
      return { timeLeftDisplay: `${hours} hours left`, formattedDate, repeatDisplay };
    }
    return { timeLeftDisplay: `${minutes} minutes left`, formattedDate, repeatDisplay };
  };

  const updateTaskDate = async (taskId, newDate) => {
    if (!taskId || !newDate) {
      console.error('Invalid taskId or newDate:', { taskId, newDate });
      return;
    }

    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { date: newDate.toISOString() });
    } catch (error) {
      console.error('Error updating task date:', error.message);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      Alert.alert('Task Deleted', 'The task has been successfully deleted.');
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const renderRightActions = (taskId) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => deleteTask(taskId)}
    >
      <Text style={styles.deleteButtonText}>Delete</Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>My Countdowns 📌</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AddTask')}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
  data={tasks}
  keyExtractor={(item) => item.id}
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
  renderItem={({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <TouchableOpacity
        style={[
          styles.taskContainer,
          { backgroundColor: item.color }, 
        ]}
        onPress={() => navigation.navigate('EditTask', { task: item })}
      >
        <View style={styles.taskContent}>
          <Text style={[styles.taskName, isDarkMode && styles.darkText]}>
            {item.name}
          </Text>
          <Text style={[styles.taskDate, isDarkMode && styles.darkText]}>
            {item.formattedDate}
          </Text>
        </View>
        <View style={styles.timeLeftContainer}>
          <Text style={[styles.timeLeft, isDarkMode && styles.darkText]}>
            {item.timeLeftDisplay}
          </Text>
          {item.repeatDisplay ? (
            <Text style={[styles.repeatText, isDarkMode && styles.darkText]}>
              {item.repeatDisplay}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Swipeable>
  )}
/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  darkContainer: {
    backgroundColor: '#222',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  darkText: {
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    padding: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
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
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  taskDate: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
  },
  repeatText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  timeLeftContainer: {
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 10,
  },
  timeLeft: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default HomeScreen;
