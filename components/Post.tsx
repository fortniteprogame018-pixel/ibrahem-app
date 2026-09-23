import EvilIcons from '@expo/vector-icons/EvilIcons';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


const Post = (props: any) => {
  return (
    <TouchableOpacity onPress={()=>{alert("hi")}}>
      <View>
        <View style={styles.anime}>
          <Image style={styles.img} source={{ uri: props.pic1 }} />
          <Text style={styles.ahmed}>{props.name}</Text>



        </View>

        <Text>{props.name2}</Text>

        <Image style={styles.img1} source={{ uri: props.pic2 }} />
        <Feather name="heart" size={24} color="black" />
        <EvilIcons name="comment" size={24} color="black" />
        <Feather name="repeat" size={24} color="black" />
        <FontAwesome name="paper-plane" size={24} color="black" />
        <Ionicons name="bookmark-outline" size={24} color="black" />

      </View>
    </TouchableOpacity>
  )

}

export default Post

const styles = StyleSheet.create({
  img: {
    width: 50,
    height: 50,
    borderRadius: 50,

  },
  img1: {
    width: 800,
    height: 300,
    // borderRadius:50 ,
    resizeMode: "stretch",




  },



  ahmed: {

    fontSize: 22,

    fontWeight: "400",



  },
  anime: {
    flexDirection: "row"




  },






})







