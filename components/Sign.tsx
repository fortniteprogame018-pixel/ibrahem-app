import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const Sign = (props) => {

  const navigation = useRouter();

  const pressCard = () => {
    const dataStr = JSON.stringify(props);

    navigation.push({
      pathname: "/page",
      params: { data: dataStr },
    });
  };  

  return (
     <TouchableOpacity style={styles.card} onPress={pressCard}>
          <Image 
            source={{ uri: props.image }} 
            style={styles.image} 
          />
          <View style={styles.cardInfo}>
            <Text style={styles.wordText}>{props.text}</Text>
            <TouchableOpacity style={styles.listenButton}>
              <Ionicons name="volume-high-outline" size={20} color="#000000" />
              <Text style={styles.listenText}>استمع</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
  )
}

export default Sign

const styles = StyleSheet.create({
      container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // خلفية بيضاء بالكامل مثل تطبيقك السابق
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 12,
    height: 45,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
    color: '#000000',
    marginRight: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA', // تحديد خفيف للبطاقة لتبدو مرتبة
    width:'45%',
      boxShadow: '-10px 4px 12px rgba(0, 0, 0, 0.2)', 
      

  },

  
  image: {
    width: "100%",
    height: 250
  ,
    resizeMode:'contain'

  },
  cardInfo: {
    padding: 16,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
  },
  listenButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  listenText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
})