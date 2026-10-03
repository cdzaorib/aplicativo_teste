import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      {/* Os TabTrigger precisam ser filhos diretos do elemento passado ao TabList. */}
      <TabList asChild>
        <BarraAbas>
          <TabTrigger name="index" href="/" asChild>
            <BotaoAba>Minha lista</BotaoAba>
          </TabTrigger>
          <TabTrigger name="gestacao" href="/gestacao" asChild>
            <BotaoAba>Gestação</BotaoAba>
          </TabTrigger>
          <TabTrigger name="sugestoes" href="/sugestoes" asChild>
            <BotaoAba>Sugestões</BotaoAba>
          </TabTrigger>
          <TabTrigger name="conta" href="/conta" asChild>
            <BotaoAba>Conta</BotaoAba>
          </TabTrigger>
        </BarraAbas>
      </TabList>
    </Tabs>
  );
}

function BarraAbas({ children, ...props }: TabListProps) {
  return (
    <View {...props} style={styles.container}>
      <ThemedView type="backgroundElement" style={styles.barra}>
        {children}
      </ThemedView>
    </View>
  );
}

function BotaoAba({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressionado}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.botao}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: Spacing.three,
    alignItems: 'center',
  },
  barra: {
    flexDirection: 'row',
    justifyContent: 'center',
    // Com 4 abas, cabe até em telas de 320 pontos.
    gap: Spacing.one,
    padding: Spacing.two,
    borderRadius: Radius.large,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  botao: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.medium,
  },
  pressionado: {
    opacity: 0.7,
  },
});
