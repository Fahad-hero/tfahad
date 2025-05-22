import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Linking, AppState } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

type FileItem = {
  id: string;
  name: string;
  type: string;
  webViewLink: string;
  thumbnailLink?: string;
};

export default function HomeScreen() {  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const previousFilesLength = useRef(0);
  const appState = useRef(AppState.currentState);
  const pollingInterval = useRef<NodeJS.Timeout>();  const fetchFiles = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {      const response = await fetch('https://script.google.com/macros/s/AKfycbwSs-X7BrHjy2gNLRE4mU09waNh84P1DGynlh_bHc39bWlbOa2aQcaViRgS-vRKfWEmTQ/exec');
      const data = await response.json();
      const newFiles = data.files || [];
      
      // التحقق من وجود ملفات جديدة
      if (newFiles.length > previousFilesLength.current) {
        toast.message('تم إضافة ملفات جديدة! 📁', {
          duration: 3000,
        });
      }
      
      previousFilesLength.current = newFiles.length;
      setFiles(newFiles);
    } catch (error) {
      toast.error('حدث خطأ في تحميل الملفات');
    } finally {
      setLoading(false);
    }
  };  // إعداد التحديث التلقائي والتعامل مع حالة التطبيق
  useEffect(() => {
    fetchFiles();

    // إعداد مراقبة حالة التطبيق
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        fetchFiles(false);
      }
      appState.current = nextAppState;
    });

    // إعداد التحديث التلقائي كل 30 ثانية
    const startPolling = () => {
      pollingInterval.current = setInterval(() => {
        if (appState.current === 'active') {
          fetchFiles(false);
        }
      }, 30000); // تحديث كل 30 ثانية
    };

    startPolling();

    // تنظيف
    return () => {
      subscription.remove();
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [fetchFiles]);

  const filteredFiles = files.filter(file => {
    if (activeTab === 'all') return true;
    if (activeTab === 'images') return file.type.includes('image');
    if (activeTab === 'pdfs') return file.type.includes('pdf');
    return true;
  });

  const openFile = (webViewLink: string) => {
    Linking.openURL(webViewLink);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ملفاتي</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchFiles}>
          <MaterialIcons name="refresh" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}>
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>الكل</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'images' && styles.activeTab]}
          onPress={() => setActiveTab('images')}>
          <Text style={[styles.tabText, activeTab === 'images' && styles.activeTabText]}>الصور</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pdfs' && styles.activeTab]}
          onPress={() => setActiveTab('pdfs')}>
          <Text style={[styles.tabText, activeTab === 'pdfs' && styles.activeTabText]}>PDF ملفات</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>جاري تحميل الملفات...</Text>
        </View>
      ) : (
        <ScrollView style={styles.filesList}>
          {filteredFiles.map((file) => (
            <TouchableOpacity
              key={file.id}
              style={styles.fileItem}
              onPress={() => openFile(file.webViewLink)}>
              <View style={styles.fileIconContainer}>
                {file.type.includes('image') ? (
                  <Image 
                    source={{ uri: file.thumbnailLink || 'https://via.placeholder.com/40' }} 
                    style={styles.thumbnail} 
                  />
                ) : (
                  <MaterialIcons name="picture-as-pdf" size={40} color="#FF4136" />
                )}
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{file.name}</Text>
                <Text style={styles.fileType}>
                  {file.type.includes('image') ? 'صورة' : 'PDF ملف'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  refreshButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  filesList: {
    flex: 1,
    padding: 16,
  },
  fileItem: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  fileType: {
    fontSize: 14,
    color: '#666',
  },
});