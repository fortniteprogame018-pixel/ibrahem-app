import React from 'react';
import {
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity
} from 'react-native';

export default function SignModal({ visible, item, onClose }) {
  // إذا لم يتم اختيار أي عنصر، لا يتم عرض أي شيء
  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* خلفية معتمة عند الضغط عليها يتم إغلاق المودال */}
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        
        {/* صندوق المحتوى (منع انتشار الضغط لكي لا يُغلق عند النقر بداخله) */}
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          
          {/* عنوان الكلمة */}
          <Text style={styles.modalTitle}>{item.title}</Text>

          {/* الصورة المكبرة للإشارة */}
          <Image source={item.image} style={styles.signImage} />

          {/* زر الإغلاق */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>إغلاق</Text>
          </TouchableOpacity>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    width: '85%',
    boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.25)',
    elevation: 10,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 15, 
    color: '#333' 
  },
  signImage: { 
    width: 200, 
    height: 200, 
    borderRadius: 15, 
    marginBottom: 20,
    resizeMode: 'contain',
  },
  closeButton: { 
    backgroundColor: '#007AFF', 
    paddingVertical: 12, 
    paddingHorizontal: 30, 
    borderRadius: 12, 
    width: '100%', 
    alignItems: 'center' 
  },
  closeText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
});