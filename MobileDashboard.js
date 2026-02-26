// MobileDashboard.js

import React from 'react';
import { ScrollView, SafeAreaView } from 'react-native';
import { View, Text } from 'react-native';

const MobileDashboard = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* Welcome Screen */}
        <View style={{ padding: 20 }}>
          <Text>Welcome to Your Rental Rights</Text>
        </View>

        {/* New Incident Screen */}
        <View style={{ padding: 20 }}>
          <Text>Report a New Incident</Text>
        </View>

        {/* Timeline Screen */}
        <ScrollView style={{ paddingBottom: 80 }}>
          {/* Example content, replace with dynamic content */}
          <Text>This is the timeline content.</Text>
          <Text>Keep adding more content here...</Text>
          <Text>More evidence items...</Text>
          {/* Repeat or map over actual evidence items */}
        </ScrollView>
      </View>
      {/* Fixed Page Indicator at Bottom */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, backgroundColor: 'white' }}>
        <Text>Page Indicator</Text>
      </View>
    </SafeAreaView>
  );
};

export default MobileDashboard;