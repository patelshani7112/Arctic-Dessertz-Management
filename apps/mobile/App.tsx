import React from "react";
import { Text, TextInput, View, Button, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { storage: AsyncStorage as any }
  }
);

function useSession() {
  const [session, setSession] = React.useState<any>(null);
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { sub.subscription.unsubscribe(); };
  }, []);
  return session;
}

function Login() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  return (
    <View style={{ padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Sign in</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, padding: 8 }} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, padding: 8 }} />
      {err && <Text style={{ color: "red" }}>{err}</Text>}
      <Button title="Continue" onPress={async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setErr(error.message);
      }} />
    </View>
  );
}

function Locations() {
  const [items, setItems] = React.useState<any[]>([]);
  React.useEffect(() => {
    (async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/v1/locations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(await res.json());
    })();
  }, []);
  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>Locations</Text>
      <FlatList data={items} keyExtractor={(i) => i.id} renderItem={({ item }) => (
        <View style={{ borderWidth: 1, padding: 12, marginBottom: 8 }}>
          <Text style={{ fontWeight: "600" }}>{item.name}</Text>
          <Text>{item.tz}</Text>
        </View>
      )} />
    </View>
  );
}

export default function App() {
  const session = useSession();
  return session ? <Locations /> : <Login />;
}