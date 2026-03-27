import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { Card, Chip, IconButton } from '../components/ui';
import {
    useBookmarkedResources,
    useResources,
    useToggleBookmark,
    type Resource,
} from '../hooks/useResources';

const CATEGORIES = [
  'All',
  'IEP Rights',
  'Advocacy',
  'Legal',
  'Education',
  'Accommodations',
];

const ResourceCard: React.FC<{
  resource: Resource;
  onBookmark: (id: string, bookmarked: boolean) => void;
}> = ({resource, onBookmark}) => {
  const openUrl = useCallback(() => {
    if (resource.url) Linking.openURL(resource.url);
  }, [resource.url]);

  return (
    <Card
      style={styles.card}
      onPress={openUrl}
      accessibilityRole="link"
      accessibilityLabel={`${resource.title}. ${resource.description}. Category: ${resource.category}`}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Chip compact textStyle={styles.chipText} style={styles.chip}>
            {resource.category}
          </Chip>
          <IconButton
            icon={resource.isBookmarked ? 'bookmark' : 'bookmark-outline'}
            iconColor={resource.isBookmarked ? '#5B5AF7' : '#9CA3AF'}
            size={20}
            onPress={() => onBookmark(resource.id, !!resource.isBookmarked)}
            accessibilityLabel={
              resource.isBookmarked ? 'Remove bookmark' : 'Add bookmark'
            }
          />
        </View>
        <Text style={styles.cardTitle}>{resource.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={3}>
          {resource.description}
        </Text>
      </Card.Content>
    </Card>
  );
};

const ResourcesScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [showBookmarks, setShowBookmarks] = useState(false);

  const category = activeCategory === 'All' ? undefined : activeCategory;
  const {data, isLoading, error, refetch} = useResources(category);
  const {data: bookmarkedData} = useBookmarkedResources();
  const toggleBookmark = useToggleBookmark();

  const resources = showBookmarks
    ? bookmarkedData?.resources || []
    : data?.resources || [];

  const handleBookmark = useCallback(
    (id: string, bookmarked: boolean) => {
      toggleBookmark.mutate({id, bookmarked});
    },
    [toggleBookmark],
  );

  const renderResource = useCallback(
    ({item}: {item: Resource}) => (
      <ResourceCard resource={item} onBookmark={handleBookmark} />
    ),
    [handleBookmark],
  );

  if (error && !isLoading) {
    return <ErrorDisplay message="Failed to load resources" onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Resources</Text>
      <Text style={styles.subtitle}>
        Educational materials about IEP rights and processes
      </Text>

      {/* Filter chips */}
      <FlatList
        horizontal
        data={[
          {key: 'bookmarks', label: '★ Bookmarks'},
          ...CATEGORIES.map(c => ({key: c, label: c})),
        ]}
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filterContent}
        renderItem={({item}) => {
          const isActive =
            item.key === 'bookmarks'
              ? showBookmarks
              : !showBookmarks && activeCategory === item.key;
          return (
            <TouchableOpacity
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => {
                if (item.key === 'bookmarks') {
                  setShowBookmarks(!showBookmarks);
                } else {
                  setShowBookmarks(false);
                  setActiveCategory(item.key);
                }
              }}
              accessibilityRole="button"
              accessibilityState={{selected: isActive}}>
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
        keyExtractor={item => item.key}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5B5AF7" />
        </View>
      ) : resources.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {showBookmarks
              ? 'No bookmarked resources yet'
              : 'No resources found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          renderItem={renderResource}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FEFFFE'},
  title: {fontSize: 28, fontWeight: '700', color: '#2D2D2D', marginTop: 16, marginHorizontal: 16},
  subtitle: {fontSize: 14, color: '#6B7280', marginHorizontal: 16, marginTop: 4, marginBottom: 12},
  filters: {flexGrow: 0, marginBottom: 8},
  filterContent: {paddingHorizontal: 16, gap: 8},
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterChipActive: {backgroundColor: '#5B5AF7', borderColor: '#5B5AF7'},
  filterChipText: {fontSize: 13, fontWeight: '500', color: '#6B7280'},
  filterChipTextActive: {color: '#FFFFFF'},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32},
  emptyText: {fontSize: 16, color: '#6B7280', textAlign: 'center'},
  listContent: {padding: 16, paddingBottom: 32},
  card: {borderRadius: 20, backgroundColor: '#FFFFFF', marginBottom: 12},
  cardContent: {padding: 4},
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  chip: {backgroundColor: '#EEF2FF'},
  chipText: {fontSize: 11, color: '#5B5AF7'},
  cardTitle: {fontSize: 16, fontWeight: '600', color: '#2D2D2D', marginVertical: 4},
  cardDesc: {fontSize: 14, color: '#6B7280', lineHeight: 20},
});

export default ResourcesScreen;
