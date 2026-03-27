import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { Card, Chip, FAB } from '../components/ui';
import { useChildren } from '../hooks/useChildren';
import { useIEPDocuments, type IEPDocument } from '../hooks/useDocuments';
import { API } from '../lib/api-config';
import { streamNDJSON } from '../lib/http-stream';
import { secureStore } from '../lib/secure-store';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const statusColors: Record<string, string> = {
  uploaded: '#F59E0B',
  analyzing: '#5B5AF7',
  analyzed: '#10B981',
  error: '#EF4444',
};

const DocumentCard: React.FC<{doc: IEPDocument}> = ({doc}) => (
  <Card
    style={styles.card}
    accessibilityLabel={`Document: ${doc.fileName}, status: ${doc.status}`}>
    <Card.Content>
      <Text style={styles.docName} numberOfLines={1}>
        {doc.fileName}
      </Text>
      <Text style={styles.docDate} accessibilityRole="text">
        {new Date(doc.uploadDate).toLocaleDateString()}
      </Text>
      <Chip
        compact
        style={[
          styles.statusChip,
          {backgroundColor: (statusColors[doc.status] || '#9CA3AF') + '20'},
        ]}
        textStyle={{color: statusColors[doc.status] || '#9CA3AF', fontSize: 12}}
        accessibilityLabel={`Status: ${doc.status}`}>
        {doc.status}
      </Chip>
    </Card.Content>
  </Card>
);

const DocumentsScreen: React.FC = () => {
  const {data: childrenData} = useChildren();
  const children = childrenData?.children || [];
  const firstChildId = children[0]?.id;

  const {data, isLoading, error, refetch} = useIEPDocuments(firstChildId);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const queryClient = useQueryClient();

  const handleUpload = useCallback(async () => {
    if (!firstChildId) {
      Alert.alert('No Child', 'Please add a child profile first.');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const file = result.assets[0];

    if (file.size && file.size > MAX_FILE_SIZE) {
      Alert.alert('File too large', 'Maximum size is 25MB.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress('Uploading...');

      const token = await secureStore.getToken();
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name || 'document.pdf',
        type: file.mimeType || 'application/pdf',
      } as any);
      formData.append('childId', firstChildId);

      const response = await fetch(API.iepUpload, {
        method: 'POST',
        headers: {Authorization: `Bearer ${token}`},
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const uploaded = await response.json();
      setUploadProgress('Analyzing...');

      await streamNDJSON(API.iepAnalyze(uploaded.id), {
        onData: (chunk: any) => {
          if (chunk.status) setUploadProgress(chunk.status);
        },
        onError: () => {
          setUploadProgress('Analysis interrupted — check document library');
        },
        onComplete: () => {
          setUploadProgress('');
          setUploading(false);
          queryClient.invalidateQueries({queryKey: ['iep-documents']});
        },
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not upload document');
      setUploading(false);
      setUploadProgress('');
    }
  }, [firstChildId, queryClient]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5B5AF7" />
      </View>
    );
  }

  if (error) {
    return <ErrorDisplay message={(error as Error).message} onRetry={() => refetch()} />;
  }

  const documents = data?.documents || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        IEP Documents
      </Text>

      {uploading && (
        <Card style={styles.uploadCard}>
          <Card.Content style={styles.uploadContent}>
            <ActivityIndicator size="small" color="#5B5AF7" />
            <Text style={styles.uploadText}>{uploadProgress}</Text>
          </Card.Content>
        </Card>
      )}

      {documents.length === 0 && !uploading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No documents yet</Text>
          <Text style={styles.emptySubtext}>
            Upload your child's IEP document for AI analysis
          </Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={item => item.id}
          renderItem={({item}) => <DocumentCard doc={item} />}
          contentContainerStyle={styles.list}
        />
      )}

      {!uploading && (
        <FAB
          icon="file-upload"
          onPress={handleUpload}
          style={styles.fab}
          label="Upload IEP"
          accessibilityLabel="Upload IEP document"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FEFFFE', padding: 16},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {fontSize: 28, fontWeight: '700', color: '#2D2D2D', marginBottom: 16, marginTop: 16},
  uploadCard: {borderRadius: 20, marginBottom: 12, backgroundColor: '#EEF2FF'},
  uploadContent: {flexDirection: 'row', alignItems: 'center', gap: 12},
  uploadText: {fontSize: 14, color: '#5B5AF7', fontWeight: '500'},
  empty: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  emptyText: {fontSize: 18, fontWeight: '600', color: '#2D2D2D', marginBottom: 8},
  emptySubtext: {fontSize: 14, color: '#6B7280', textAlign: 'center'},
  list: {paddingBottom: 100},
  card: {borderRadius: 20, backgroundColor: '#FFFFFF', marginBottom: 12},
  docName: {fontSize: 15, fontWeight: '600', color: '#2D2D2D', marginBottom: 4},
  docDate: {fontSize: 13, color: '#9CA3AF', marginBottom: 8},
  statusChip: {alignSelf: 'flex-start'},
  fab: {position: 'absolute', right: 16, bottom: 24},
});

export default DocumentsScreen;
