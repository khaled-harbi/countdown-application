import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFirestore, collection, addDoc } from '@firebase/firestore';
import { getAuth } from '@firebase/auth';
import { scheduleNotificationsForTask } from '../App';
import { AppContext } from '../App';

const AddTaskScreen = ({ navigation }) => {
  const { isDarkMode } = useContext(AppContext);
  const [taskName, setTaskName] = useState('');
  const [date, setDate] = useState(new Date());
  const [isAllDay, setIsAllDay] = useState(true); 
  const [repeat, setRepeat] = useState('Off');
  const [color, setColor] = useState('#f44336');
  const db = getFirestore();
  const auth = getAuth();
  const user = auth.currentUser;
  const { notificationsEnabled } = useContext(AppContext); 

  const addTask = async () => {
    if (!taskName.trim()) {
      alert('Task name is required');
      return;
    }
    if (!user) {
      alert('User not authenticated');
      return;
    }
  
    const newTask = {
      name: taskName,
      date: date.toISOString(),
      allDay: isAllDay,
      repeat,
      color,
      uid: user.uid,
    };
  
    try {
      await addDoc(collection(db, 'tasks'), newTask);
      await scheduleNotificationsForTask(newTask, notificationsEnabled); // Schedule notifications
      navigation.goBack();
    } catch (error) {
      console.error('Error adding task:', error.message);
    }
  };
  

  const handleRepeatChange = (option) => {
    setRepeat(option);
    if (option === 'Daily') {
      setDate((prevDate) => {
        const updatedDate = new Date(prevDate);
        if (isAllDay) {
          updatedDate.setHours(23, 59, 0, 0);
        }
        return updatedDate;
      });
    }
  };

  const handleAllDayChange = (value) => {
    setIsAllDay(value);
    setDate((prevDate) => {
      const updatedDate = new Date(prevDate);
      if (value) {
        updatedDate.setHours(23, 59, 0, 0);
      }
      return updatedDate;
    });
  };

  const colorOptions = [
    '#f44336', '#ff9800', '#ffeb3b', '#483D8B', '#009688', '#9c27b0',
    '#3CB371', '#000000', '#FF10F0', '#4169E1', '#556B2F', '#f1c40f',
    '#DC143C', '#ff69b4', '#34495e', '#B8860B', '#4682B4', '#d35400',
  ];

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        isDarkMode && styles.darkContainer,
      ]}
    >
      <Text style={[styles.title, isDarkMode && styles.darkText]}>Add New Task</Text>

      <Text style={[styles.label, isDarkMode && styles.darkText]}>Task Name</Text>
      <TextInput
        style={[
          styles.input,
          isDarkMode && styles.darkInput,
        ]}
        placeholder="Enter task name"
        placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
        value={taskName}
        onChangeText={setTaskName}
      />

{repeat !== 'Daily' && (
  <>
    <Text style={[styles.label, isDarkMode && styles.darkText]}>Task Date</Text>
    <View style={styles.centeredPicker}>
  <DateTimePicker
    value={date}
    mode="date"
    display={Platform.OS === 'ios' ? 'inline' : 'default'}
    themeVariant={isDarkMode ? 'dark' : 'light'}
    onChange={(event, selectedDate) => {
      if (selectedDate) {
        setDate((prevDate) => {
          const updatedDate = new Date(prevDate);
          updatedDate.setFullYear(selectedDate.getFullYear());
          updatedDate.setMonth(selectedDate.getMonth());
          updatedDate.setDate(selectedDate.getDate());
          if (isAllDay) {
            updatedDate.setHours(23, 59, 0, 0);
          }
          return updatedDate;
        });
      }
    }}
  />
</View>
  </>
)}

      <View style={styles.rowContainer}>
        <Text style={[styles.label, isDarkMode && styles.darkText]}>All-day</Text>
        <Switch value={isAllDay} onValueChange={handleAllDayChange} />
      </View>

      {!isAllDay && (
  <>
    <Text style={[styles.label, isDarkMode && styles.darkText]}>Task Time</Text>
    <View style={styles.centeredPicker}>
      <DateTimePicker
        value={date}
        mode="time"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        themeVariant={isDarkMode ? 'dark' : 'light'} // White text in dark mode
        onChange={(event, selectedTime) => {
          if (selectedTime) {
            setDate((prevDate) => {
              const updatedDate = new Date(prevDate);
              updatedDate.setHours(selectedTime.getHours());
              updatedDate.setMinutes(selectedTime.getMinutes());
              return updatedDate;
            });
          }
        }}
      />
    </View>
  </>
)}


      <Text style={[styles.label, isDarkMode && styles.darkText]}>Repeat</Text>
      <View style={styles.repeatContainer}>
        {['Off', 'Daily', 'Weekly', 'Monthly', 'Yearly'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.repeatOption,
              repeat === option && styles.selectedOption,
              isDarkMode && styles.darkSelectedOption,
            ]}
            onPress={() => handleRepeatChange(option)}
          >
            <Text
              style={[
                styles.optionText,
                repeat === option && styles.selectedOptionText,
                isDarkMode && styles.darkText,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, isDarkMode && styles.darkText]}>Task Color</Text>
      <View style={styles.colorContainer}>
        {colorOptions.map((colorOption) => (
          <TouchableOpacity
            key={colorOption}
            style={[
              styles.colorOption,
              { backgroundColor: colorOption },
              color === colorOption && styles.selectedColor,
              isDarkMode && styles.darkColorOption,
            ]}
            onPress={() => setColor(colorOption)}
          />
        ))}
      </View>

      <Button title="Add Task" onPress={addTask} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  datePickerWrapper: {
    padding: 10,
    borderRadius: 10,
  },
  lightBackground: {
    backgroundColor: '#fff', // White background for dark mode
  },
  darkContainer: {
    backgroundColor: '#222', // Dark mode background
  },
  darkText: {
    color: '#fff', // Light text for dark mode
  },
  darkInput: {
    backgroundColor: '#333', // Input background in dark mode
    color: '#fff', // Input text color
    borderColor: '#555', // Input border in dark mode
  },
  darkSelectedOption: {
    backgroundColor: '#555', // Dark mode selected repeat option
  },
  darkColorOption: {
    borderColor: '#999', // Dark mode border for task colors
  },
  centeredPicker: {
    alignItems: 'center',
    marginBottom: 20,
  },  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    textAlign: 'center',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  centeredPicker: {
    alignItems: 'center',
    marginBottom: 20,
  },
  repeatContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  repeatOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  selectedOption: {
    backgroundColor: '#007bff',
  },
  optionText: {
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    margin: 10,
  },
  selectedColor: {
    borderColor: '#000',
  },
});

export default AddTaskScreen;
