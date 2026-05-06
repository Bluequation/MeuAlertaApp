import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function App() {
  const [alertas, setAlertas] = useState([]);
  const [menuAberto, setMenuAberto] = useState(false);
  const [localClicado, setLocalClicado] = useState(null);

  // 1. O que acontece ao clicar no mapa
  const aoClicarNoMapa = (evento) => {
    setLocalClicado(evento.nativeEvent.coordinate);
    setMenuAberto(true); // Abre a gaveta de baixo
  };

  // 2. O que acontece ao escolher um alerta na gaveta
  const adicionarAlerta = (tipo) => {
    if (localClicado) {
      const novoAlerta = {
        id: Math.random().toString(),
        coordenada: localClicado,
        tipo: tipo,
      };
      setAlertas([...alertas, novoAlerta]); // Salva o alerta na lista
      setMenuAberto(false); // Fecha a gaveta
      setLocalClicado(null); // Limpa o clique anterior
    }
  };

  return (
    <View style={styles.container}>
      {/* O MAPA NA TELA TODA */}
      <MapView 
        style={styles.mapa}
        initialRegion={{
          latitude: -8.0801, // Focado no Sertão (ajuste se quiser)
          longitude: -39.7258,
          latitudeDelta: 3.0,
          longitudeDelta: 3.0,
        }}
        onPress={aoClicarNoMapa}
      >
        {/* Mostrando os alertas já criados */}
        {alertas.map(alerta => (
          <Marker 
            key={alerta.id} 
            coordinate={alerta.coordenada} 
            title={alerta.tipo} 
          />
        ))}
      </MapView>

      {/* A ABA INFERIOR (GAVETA DE ALERTAS) */}
      {menuAberto && (
        <View style={styles.abaInferior}>
          <Text style={styles.tituloAba}>Qual alerta registrar aqui?</Text>
          
          <View style={styles.areaBotoes}>
            <TouchableOpacity style={styles.botao} onPress={() => adicionarAlerta('🌊 Passagem Molhada')}>
              <Text style={styles.textoBotao}>🌊 Molhada</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botao} onPress={() => adicionarAlerta('🌧️ Chuva')}>
              <Text style={styles.textoBotao}>🌧️ Chuva</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botao} onPress={() => adicionarAlerta('⚡ Energia')}>
              <Text style={styles.textoBotao}>⚡ Energia</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// 3. O VISUAL DO APLICATIVO
const styles = StyleSheet.create({
  container: { flex: 1 },
  mapa: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  abaInferior: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  tituloAba: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' },
  areaBotoes: { flexDirection: 'row', justifyContent: 'space-around' },
  botao: { backgroundColor: '#e2e8f0', padding: 15, borderRadius: 10, alignItems: 'center', width: '30%' },
  textoBotao: { fontSize: 13, fontWeight: 'bold', color: '#333' }
});