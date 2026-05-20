import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../../lib/supabase";

import { COLORS, MONO } from "../photo/theme";
import { Field } from "../auth/Field";

type Mode = "signIn" | "signUp";

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "signIn" ? "signUp" : "signIn"));
    setError(null);
    setInfo(null);
  }, []);

  const submit = useCallback(async () => {
    if (!email || !password) {
      setError("Podaj email i hasło.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      if (mode === "signIn") {
        const { error: e } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (e) throw e;
        // useSession picks up the change — no nav needed.
      } else {
        const { error: e } = await supabase.auth.signUp({
          email,
          password,
        });
        if (e) throw e;
      }
    } catch (e: any) {
      setError(e?.message ?? "Coś poszło nie tak.");
    } finally {
      setSubmitting(false);
    }
  }, [email, password, mode]);

  const eyebrow =
    mode === "signIn" ? "KARTA CZŁONKOWSKA" : "NOWA KARTA CZŁONKOWSKA";
  const headline = mode === "signIn" ? "Witaj\nz powrotem." : "Załóż\nkartę.";
  const submitLabel = mode === "signIn" ? "ZALOGUJ SIĘ" : "ZAREJESTRUJ SIĘ";
  const toggleLabel =
    mode === "signIn" ? "Jestem tu pierwszy raz.. →" : "Mam już swoją kartę! →";

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.perforation} />

          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.headline}>{headline}</Text>

          <Field
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <Field
            label="HASŁO"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoComplete={
              mode === "signIn" ? "current-password" : "new-password"
            }
            textContentType={mode === "signIn" ? "password" : "newPassword"}
          />

          {error ? <Text style={styles.error}>✕ {error}</Text> : null}
          {info ? <Text style={styles.info}>✓ {info}</Text> : null}

          <TouchableOpacity
            style={[styles.primary, submitting && styles.primaryDisabled]}
            onPress={submit}
            disabled={submitting}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.paper} />
            ) : (
              <Text style={styles.primaryText}>{submitLabel}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleMode} activeOpacity={0.6}>
            <Text style={styles.toggle}>{toggleLabel}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.paperEdge },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.hairline,
    padding: 22,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 0,
    elevation: 6,
  },

  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  metaCell: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 1.2,
    color: COLORS.ink,
  },
  perforation: {
    marginVertical: 6,
  },

  eyebrow: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.stamp,
    marginBottom: 12,
  },
  headline: {
    fontSize: 36,
    lineHeight: 38,
    fontWeight: "900",
    color: COLORS.ink,
    letterSpacing: -1.2,
    marginBottom: 28,
  },

  field: { marginBottom: 18 },
  fieldLabel: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.inkSoft,
    marginBottom: 6,
  },
  fieldInput: {
    fontFamily: MONO,
    fontSize: 16,
    color: COLORS.ink,
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink,
  },

  error: {
    fontFamily: MONO,
    fontSize: 12,
    color: COLORS.stamp,
    marginBottom: 14,
  },
  info: {
    fontFamily: MONO,
    fontSize: 12,
    color: COLORS.signal,
    marginBottom: 14,
    lineHeight: 18,
  },

  primary: {
    backgroundColor: COLORS.ink,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  primaryDisabled: { opacity: 0.5 },
  primaryText: {
    color: COLORS.paper,
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
  },

  toggle: {
    textAlign: "center",
    fontFamily: MONO,
    fontSize: 12,
    color: COLORS.inkSoft,
    textDecorationLine: "underline",
    letterSpacing: 1,
  },
});
