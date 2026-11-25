import { EvilIcons, Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Post = (props: any) => {
  return (
    <TouchableOpacity onPress={() => alert("hi")}>
      <View>
        <View style={styles.anime}>
          <Image style={styles.img} source={{ uri: props.pic1 }} contentFit="cover" />
          <Text style={styles.ahmed}>{props.name}</Text>
        </View>
      </View>

      <Text>{props.name2}</Text>

      <Image style={styles.img} source={{ uri: props.pic2 }} contentFit="cover" />

      <Feather name="heart" size={24} color="black" />
      <EvilIcons name="comment" size={24} color="black" />
      <Feather name="repeat" size={24} color="black" />
      <FontAwesome name="paper-plane" size={24} color="black" />
      <Ionicons name="bookmark-outline" size={24} color="black" />
    </TouchableOpacity>
  );
};

export default Post;

const styles = StyleSheet.create({
  img: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  ahmed: {
    fontSize: 16,
    fontWeight: "400",
  },
  anime: {
    flexDirection: "row",
  },
});