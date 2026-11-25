import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const page = () => {

    const params= useLocalSearchParams()
   // const datasign = JSON.parse(data:params)
  return (
    <View>
      <Text>page</Text>
    </View>
  )
}

export default page

const styles = StyleSheet.create({})
