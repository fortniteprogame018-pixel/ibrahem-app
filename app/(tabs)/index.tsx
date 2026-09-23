import Post from '@/components/Post'
import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

const index = () => {
  return (
    <ScrollView >

    <View style={styles.container}>

<Post name={'rodri'} pic1={'https://www.aljazeera.com/wp-content/uploads/2026/08/2026-08-18T165829Z_868622903_UP1EM8I1B5FNV_RTRMADP_3_SOCCER-SPAIN-BAR-RODRI-1787073769.jpg?resize=1800%2C1800'} name2={'to brcelona '} pic2={'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQY7KXXjuo2Y08A24VSt0NPJX9DNQQQyBXkv7irpcfiAi0H7xCVUw9EKxE&s=10s'}/>
<Post name={'pedri'} pic1={'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTsCNW7TfGwZT2tJcfHRASETlYbi9EeizUSnNMe59xMMt2EzZSEUAjIe5h&s=10'} name2={'vamosssss'} pic2={'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmEO6QVpn71mrCgyRoc4gMkZ3zyr_SPX3JrtZ4mhm6lA&s=10'}/>
<Post />


</View> 
       </ScrollView>




  )
}




export default index

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center"
  },
  chat: {
    textAlign: "right",
    fontSize: 40,
    fontWeight: "800",
    marginTop: 70

  },
  name1: {

    fontSize: 30,
    fontWeight: "800",

  },
  search: {
    borderWidth: 5,
    width: "90%",
    height: 50,
    borderRadius: 90,
    alignSelf: "center"
  },
  albahth: {

    fontWeight: "400",
    marginRight: 20,
  },
  image1: {
    width: 40,
    height: 40,
    resizeMode: "contain",

  },

  chatContainer: {
    borderWidth: 3,
    width: "90%",
    height: 80,
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "center",
    alignItems: "center",
    margin: 20,
  },
  time1: {
    fontSize: 30,
    fontWeight: "600",


  },

watsapp: {

  
}



})/////////