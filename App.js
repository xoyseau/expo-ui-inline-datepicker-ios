import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// Labels keep their size so the calendar stays on screen at accessibility sizes.
const Label = (props) => <Text maxFontSizeMultiplier={1} {...props} />;

// August 2026 spans 6 calendar weeks, October 2026 spans 5.
const PICKERS = [
  { key: 'aug', label: 'Aug 2026 (6 weeks)', initial: new Date(2026, 7, 12) },
  { key: 'oct', label: 'Oct 2026 (5 weeks)', initial: new Date(2026, 9, 14) },
];

function MeasuredPicker({ label, value }) {
  const [heights, setHeights] = useState([]);

  return (
    <View style={styles.section}>
      <Label style={styles.heading}>{label}</Label>
      <Label>Host heights: {heights.join(' → ') || '…'}</Label>
      <View
        style={styles.frame}
        onLayout={(event) => {
          const height = Math.round(event.nativeEvent.layout.height * 100) / 100;
          setHeights((previous) =>
            previous[previous.length - 1] === height
              ? previous
              : [...previous, height],
          );
        }}
      >
        <DateTimePicker value={value} mode="date" display="inline" />
      </View>
    </View>
  );
}

export default function App() {
  // Changing the selection is what re-measures the picker in #47765.
  const [shift, setShift] = useState(0);

  // Once, so the settled height shows up without tapping.
  useEffect(() => {
    const timer = setTimeout(() => setShift(1), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
    >
      <Label
        accessibilityRole="button"
        style={styles.button}
        onPress={() => setShift((previous) => previous + 1)}
      >
        {`Change selection (+${shift + 1} day)`}
      </Label>
      {PICKERS.map(({ key, label, initial }) => (
        <MeasuredPicker
          key={key}
          label={label}
          value={
            new Date(
              initial.getFullYear(),
              initial.getMonth(),
              initial.getDate() + shift,
            )
          }
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  section: { gap: 4 },
  heading: { fontWeight: '700' },
  button: { color: '#007AFF', fontSize: 17, textAlign: 'center' },
  frame: { borderWidth: 1, borderColor: '#FF3B30' },
});
