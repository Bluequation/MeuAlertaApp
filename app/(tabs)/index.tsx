import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, TextInput, Alert, Animated, ScrollView, Modal, Image, Platform, KeyboardAvoidingView, StatusBar } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons, FontAwesome,FontAwesome5, FontAwesome6, Foundation, AntDesign } from '@expo/vector-icons';
import { db } from '../../firebaseConfig';
import { collection, addDoc, onSnapshot, updateDoc, doc, query, orderBy, setDoc, getDoc, limit, increment } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ALTURA_TELA = Dimensions.get('window').height;
const LARGURA_TELA = Dimensions.get('window').width;

// 🎨 Estilo minimalista para deixar o mapa branco e limpo
// 🎨 Estilo "Prateado": Limpo, mas com ruas visíveis e água azul clara
const estiloMapaMelhorado = [
  {
    "elementType": "geometry",
    "stylers": [{"color": "#ffffff"}] // Fundo do mapa em cinza bem claro
  },
  {
    "elementType": "labels.icon",
    "stylers": [{"visibility": "off"}] // Oculta ícones de comércio e pontos de interesse
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#616161"}] // Cor dos textos das cidades e ruas
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#f5f5f5"}] // Contorno do texto
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{"color": "#eeeeee"}] // Áreas de praças e parques discretas
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{"color": "#f2f2f2"}] // Ruas em branco (dá um contraste excelente)
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#757575"}]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{"color": "#dadada"}] // Rodovias um pouco mais destacadas
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{"color": "#d2ebff"}] // Água num tom de azul pastel
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#9e9e9e"}]
  }
];

const ICONES: any = {
  Usuario: require('../../assets/images/Usuario_3d.png'),
  Perfil_cacto: require('../../assets/images/Perfil_cacto.png'),
  Trofeu: require('../../assets/images/Trofeu.png'),
  Alertar: require('../../assets/images/Alertar.png'),
  Boneco: require('../../assets/images/Boneco.png'),
  Pluviometro: require('../../assets/images/Pluviometro.png'),
  FazendaIcone: require('../../assets/images/casa.png'),
  
  Passagem_molhada: require('../../assets/images/Passagem_molhada.png'),
  Chuva: require('../../assets/images/Chuva.png'),
  Energia: require('../../assets/images/Energia1.png'),

  Chuva_sereno: require('../../assets/images/Chuva_sereno.png'),
  Chuva_branda: require('../../assets/images/Chuva_branda.png'),
  Chuva_temporal_semvento: require('../../assets/images/Chuva_temporal_semvento.png'),
  Chuva_temporal_comvento: require('../../assets/images/Chuva_temporal_comvento.png'),

  Energia1: require('../../assets/images/Energia_sem.png'), 
  Energia1_rua: require('../../assets/images/Energia1_rua.png'),
  Energia1_osc: require('../../assets/images/Energia1_osc.png'),

  Passagem_livre: require('../../assets/images/Passagem_livre.png'),
  Passagem_agua_por_cima: require('../../assets/images/Passagem_agua_por_cima.png'),
  Passagem_interditada: require('../../assets/images/Passagem_interditada.png'),

  exploradorlevel1: require('../../assets/images/exploradorlevel1.png'),
  guialevel2: require('../../assets/images/guialevel2.png'),
  sentinelalevel3: require('../../assets/images/sentinelalevel3.png'),
  guardiaolevel4: require('../../assets/images/guardiaolevel4.png'),
  senhorlevel5: require('../../assets/images/senhorlevel5.png'),
  lendalevel6: require('../../assets/images/lendalevel6.png'),
  coroalevel7: require('../../assets/images/coroalevel7.png'),

  // 💡 Adicione isto dentro do seu const ICONES = { ... }
  arauto: require('../../assets/images/arauto.png'),
  cacafaisca: require('../../assets/images/cacafaisca.png'),
  dancadachuva: require('../../assets/images/dancadachuva.png'), 
  amigodaterra: require('../../assets/images/amigodaterra.png'),
  senhordosventos: require('../../assets/images/senhordosventos.png'),
  sentineladarua: require('../../assets/images/sentineladarua.png'),
  vigiadobreu: require('../../assets/images/vigiadobreu.png'),
};


// 💡 TRADUTOR DE CLIMA (Código da API para Emoji/Texto)
const TRADUTOR_CLIMA: Record<number, { emoji: string, texto: string }> = {
  0: { emoji: '☀️', texto: 'Céu Limpo' },
  1: { emoji: '🌤️', texto: 'Poucas Nuvens' },
  2: { emoji: '⛅', texto: 'Parcialmente Nublado' },
  3: { emoji: '☁️', texto: 'Nublado' },
  45: { emoji: '🌫️', texto: 'Nevoeiro' },
  48: { emoji: '🌫️', texto: 'Nevoeiro' },
  51: { emoji: '🌧️', texto: 'Garoa Leve' },
  53: { emoji: '🌧️', texto: 'Garoa Moderada' },
  55: { emoji: '🌧️', texto: 'Garoa Densa' },
  61: { emoji: '🌦️', texto: 'Chuva Leve' },
  63: { emoji: '🌧️', texto: 'Chuva Moderada' },
  65: { emoji: '⛈️', texto: 'Chuva Forte' },
  80: { emoji: '🌦️', texto: 'Pancadas Leves' },
  81: { emoji: '⛈️', texto: 'Pancadas Fortes' },
  95: { emoji: '🌩️', texto: 'Tempestade' }
};


// 💡 DICIONÁRIO DE IMAGENS ATUALIZADO (13 ESTÁGIOS)
  // Certifique-se de que os arquivos na pasta 'assets/images' tenham esses nomes exatos.
  const IMAGENS_FAZENDINHA: Record<string, any> = {
    fazenda1: require('../../assets/images/fazenda1.png'),
    fazenda2: require('../../assets/images/fazenda2.png'),
    fazenda3: require('../../assets/images/fazenda3.png'),
    fazenda4: require('../../assets/images/fazenda4.png'),
    fazenda5: require('../../assets/images/fazenda5.png'),
    fazenda6: require('../../assets/images/fazenda6.png'),
    fazenda7: require('../../assets/images/fazenda7.png'),
    fazenda8: require('../../assets/images/fazenda8.png'),
    fazenda9: require('../../assets/images/fazenda9.png'),
    fazenda10: require('../../assets/images/fazenda10.png'),
    fazenda11: require('../../assets/images/fazenda11.png'),
    fazenda12: require('../../assets/images/fazenda12.png'),
    fazenda13: require('../../assets/images/fazenda13.png'),
  };

const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
};


// 💡 COMPONENTE MÁGICO DE TRANSIÇÃO DA FAZENDINHA (VERSÃO SÓLIDA)
// 💡 COMPONENTE DA FAZENDINHA (Versão Simples e Rápida)
const ImagemFazendinhaAnimada = ({ imagemAtual }: any) => {
  return (
    <View style={{ width: '100%', height: '100%', backgroundColor: '#e1f5fe' }}>
      {IMAGENS_FAZENDINHA[imagemAtual] && (
        <Image 
          source={IMAGENS_FAZENDINHA[imagemAtual]} 
          style={{ width: '100%', height: '100%', resizeMode: 'cover' }} 
        />
      )}
    </View>
  );
};

const shadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  android: {
    elevation: 4,
  },
});

const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : 'height';

export default function TelaDoMapa() {
  const insets = useSafeAreaInsets(); // 👈 Ligar o medidor de espaço
  const mapaRef = useRef<MapView>(null);
  const [deveAnimarFazenda, setDeveAnimarFazenda] = useState(false);
  // 💡 ESTADO DO CLIMA EM TEMPO REAL
  const [climaAtual, setClimaAtual] = useState<any>(null);

  const [localizacao, setLocalizacao] = useState<any>(null);
  const [alertas, setAlertas] = useState<any[]>([]); 
  const [ranking, setRanking] = useState<any[]>([]);

  // 💡 COLOQUE AQUI: Memória da Fazendinha e Pop-up
  const [modalFazendinhaAberto, setModalFazendinhaAberto] = useState(false);
  const [modalFazendinhaTelaAberto, setModalFazendinhaTelaAberto] = useState(false); // <-- ADICIONE ESTA LINHA

  // 1. Criamos a "memória" da animação (começa na posição 0)
  const animacaoBotao = useRef(new Animated.Value(0)).current;
  
  // 2. Criamos um aviso para saber se o botão deve estar com a bolinha vermelha
  const [temEvolucaoPendente, setTemEvolucaoPendente] = useState(false); 

  // 3. A função que liga o "motorzinho" para o botão pular
  const iniciarAnimacaoBotao = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animacaoBotao, {
          toValue: -15, // O botão sobe 15 pixels
          duration: 500, // Demora meio segundo para subir
          useNativeDriver: true, // Deixa a animação super leve
        }),
        Animated.timing(animacaoBotao, {
          toValue: 0, // O botão desce de volta para a posição 0
          duration: 500, // Demora meio segundo para descer
          useNativeDriver: true,
        }),
      ])
    ).start(); // Dá o play na animação infinita
  };

  // 4. A função que desliga o motorzinho quando o usuário clica no botão
  const pararAnimacaoBotao = () => {
    animacaoBotao.setValue(0); // Garante que ele volta pro chão
    animacaoBotao.stopAnimation(); // Para de pular
  };


  const [dadosEvolucao, setDadosEvolucao] = useState<any>(null);
  const estagioMemoriaRef = useRef<number | null>(null);
  const animacaoPopUpFazendinha = useRef(new Animated.Value(0)).current;
  
  const [modoSelecaoLocal, setModoSelecaoLocal] = useState(false);
  const [coordenadaAlerta, setCoordenadaAlerta] = useState<any>(null);
  
  const [menuPrincipalAberto, setMenuPrincipalAberto] = useState(false);
  const [submenuAtual, setSubmenuAtual] = useState<string | null>(null);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<any>(null);
  
  const [milimetrosChuva, setMilimetrosChuva] = useState('');
  const [alertaSelecionado, setAlertaSelecionado] = useState<any>(null);

  const [alertasVotados, setAlertasVotados] = useState<string[]>([]);
  const [pontos, setPontos] = useState(0); 
  const [estatisticas, setEstatisticas] = useState({ 
     pluvioUsado: 0, feedbacksDados: 0,
     energia_geral: 0, energia_rua: 0, energia_oscilando: 0,
     chuva_sereno: 0, chuva_branda: 0, chuva_toroSem: 0, chuva_toroCom: 0,
     passagem_livre: 0, passagem_aguaLivre: 0, passagem_aguaPerigo: 0, passagem_interditada: 0
  });

  const [nomeUsuario, setNomeUsuario] = useState('Convidado');
  const [contaCriada, setContaCriada] = useState(false);
  
  // 💡 DOCUMENTAÇÃO: Função que analisa a categoria do alerta e retorna uma cor de fundo suave.
  const obterCorCategoria = (categoria: string) => {
    switch (categoria) {
      case 'Passagem': 
        return '#9ecbfb'; // Amarelo pastel bem discreto
      case 'Chuvas': 
        return '#9ecbfb'; // Azul bebê muito suave
      case 'Energia': 
        return '#9ecbfb'; // Lilás/Roxo bem clarinho
      default: 
        return 'white';   // Cor de segurança caso a categoria não seja reconhecida
    }
  };

  const [modoEscolhaLogin, setModoEscolhaLogin] = useState(false);
  const [modoEdicaoEmail, setModoEdicaoEmail] = useState(false); 
  const [inputNome, setInputNome] = useState('');

  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const [menuRankingAberto, setMenuRankingAberto] = useState(false);
  const [menuPluviometroAberto, setMenuPluviometroAberto] = useState(false);
  const [telaInternaPerfil, setTelaInternaPerfil] = useState('principal'); 
  const [mostrarLike, setMostrarLike] = useState(false);

  const animacaoAba = useRef(new Animated.Value(500)).current;
  const animacaoChuvaLikes = useRef(new Animated.Value(0)).current;


  // 💡 BUSCADOR DE CLIMA (Roda sempre que a localização principal muda)
  useEffect(() => {
    if (localizacao && !climaAtual) {
      const buscarClima = async () => {
        try {
          const resposta = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${localizacao.latitude}&longitude=${localizacao.longitude}&current_weather=true`);
          const dados = await resposta.json();
          
          if (dados && dados.current_weather) {
             setClimaAtual(dados.current_weather);
          }
        } catch (erro) {
          console.log("Erro ao buscar clima:", erro);
        }
      };

      buscarClima();
    }
  }, [localizacao, climaAtual]); // 👈 Adicionamos

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setLocalizacao({ latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false, shouldDuckAndroid: true });
    })();

    const qAlertas = query(collection(db, 'alertas'), orderBy('criadoEm', 'desc'));
    const escutaAlertas = onSnapshot(qAlertas, (snap) => {
      const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAlertas(todos.filter((a: any) => (a.votosResolvido || 0) < 3));
    });

    const qRanking = query(collection(db, 'usuarios'), orderBy('pontos', 'desc'), limit(10));
    const escutaRanking = onSnapshot(qRanking, (snap) => {
      setRanking(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { escutaAlertas(); escutaRanking(); };
  }, []);

  // 💡 LÓGICA DE AGRUPAMENTO (CLUSTERING) DEFINITIVA E INTELIGENTE
  const alertasAgrupados = useMemo(() => {
    if (!localizacao) return alertas.map(a => ({...a, quantidade: 1}));

    const grupos: any[] = [];
    
    // 1. O SEGREDO DO ZOOM: Um raio de "sucção" muito mais agressivo!
    // Mudámos a divisão (de /8 para /3). Agora a "bolha" engole muito mais pinos à volta.
    const raioDinamico = localizacao.longitudeDelta / 4; 

    // 2. MODO "VISTA DE PÁSSARO" (Zoom muito afastado)
    // Se o usuário tirar muito o zoom para ver o estado/cidade, ignoramos a categoria
    // e juntamos absolutamente tudo na mesma bolha para limpar a tela.
    const zoomMuitoAfastado = localizacao.longitudeDelta > 0.03;

    alertas.forEach(alerta => {
      let foiAgrupado = false;
      for (let grupo of grupos) {
         const distancia = calcularDistancia(alerta.coordenada.latitude, alerta.coordenada.longitude, grupo.coordenada.latitude, grupo.coordenada.longitude);

         // REGRAS DE FUSÃO:
         // Está dentro da área de sucção? E (É da mesma categoria OU o zoom está muito longe?)
         if (distancia < raioDinamico && (alerta.categoria === grupo.categoria || zoomMuitoAfastado)) {
             grupo.quantidade += 1;
             foiAgrupado = true;
             break;
         }
      }
      if (!foiAgrupado) grupos.push({ ...alerta, quantidade: 1 });
    });
    return grupos;
  }, [alertas, localizacao]);

  // 💡 LÓGICA DO PLUVIÔMETRO: Filtra alertas da região atual na tela e ordena por volume
  const pluviometrosDaRegiao = useMemo(() => {
    if (!localizacao) return [];

    // 1. Calcula as bordas matemáticas do mapa visível na tela
    const minLat = localizacao.latitude - (localizacao.latitudeDelta / 2);
    const maxLat = localizacao.latitude + (localizacao.latitudeDelta / 2);
    const minLon = localizacao.longitude - (localizacao.longitudeDelta / 2);
    const maxLon = localizacao.longitude + (localizacao.longitudeDelta / 2);

    // 2. Filtra os dados e transforma
    const filtrados = alertas
      .filter(a => {
         // Verifica se tem milímetros anotados e se a coordenada está dentro das bordas da tela
         const temMm = a.titulo.includes('mm)');
         const taNaTela = a.coordenada.latitude >= minLat && a.coordenada.latitude <= maxLat &&
                          a.coordenada.longitude >= minLon && a.coordenada.longitude <= maxLon;
         return temMm && taNaTela;
      })
      .map(a => {
         // Extrai apenas o número do texto (ex: "Chuvas: Toró (15.5mm)" -> 15.5)
         const match = a.titulo.match(/\((\d+(?:\.\d+)?)\s*mm\)/i);
         const milimetros = match ? parseFloat(match[1]) : 0;
         return { ...a, milimetros };
      })
      // 3. Ordena em ordem decrescente (do maior volume para o menor)
      .sort((a, b) => b.milimetros - a.milimetros);

    return filtrados;
  }, [alertas, localizacao]);

  const tocarSomDeSucesso = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3' });
      await sound.playAsync();
    } catch (erro) {}
  };
    const tocarSomEvolucao = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' });
      await sound.playAsync();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); 
    } catch (erro) {
      console.log("Erro ao tocar som de evolução:", erro);
    }
  };

  const ganharPontos = (quantidade: number) => {
    setPontos(prev => prev + quantidade);
    if (contaCriada) updateDoc(doc(db, 'usuarios', nomeUsuario), { pontos: increment(quantidade) });
    setMostrarLike(true);
    animacaoChuvaLikes.setValue(0);
    Animated.timing(animacaoChuvaLikes, { toValue: 1, duration: 3000, useNativeDriver: true }).start(() => setMostrarLike(false));
  };

  const registrarAlerta = async (categoria: string, detalhe: string, nomeDaImagem: string) => {
    let tituloDoPino = `${categoria}: ${detalhe}`;
    let pontosGanhos = 10;
    let usouPluviometro = false;

    if (milimetrosChuva !== '') {
      tituloDoPino += ` (${milimetrosChuva}mm)`;
      pontosGanhos = 15;
      usouPluviometro = true;
    }
    
    let chaveEstatistica = '';
    if (categoria === 'Energia') {
        if (detalhe === 'Faltou Geral') chaveEstatistica = 'energia_geral';
        else if (detalhe === 'Só na minha rua') chaveEstatistica = 'energia_rua';
        else if (detalhe === 'Oscilando / Fraca') chaveEstatistica = 'energia_oscilando';
    } else if (categoria === 'Chuvas') {
        if (detalhe === 'Sereno') chaveEstatistica = 'chuva_sereno';
        else if (detalhe === 'Chuva Branda') chaveEstatistica = 'chuva_branda';
        else if (detalhe === 'Toró sem vento') chaveEstatistica = 'chuva_toroSem';
        else if (detalhe === 'Toró com vento') chaveEstatistica = 'chuva_toroCom';
    } else if (categoria === 'Passagem') {
        if (detalhe === 'Passagem livre') chaveEstatistica = 'passagem_livre';
        else if (detalhe === 'Água por cima (cuidado)') chaveEstatistica = 'passagem_aguaPerigo';
        else if (detalhe === 'Água por cima (interditado)') chaveEstatistica = 'passagem_interditada';
    }

    if (chaveEstatistica !== '') {
       setEstatisticas(prev => ({ ...prev, [chaveEstatistica]: prev[chaveEstatistica as keyof typeof estatisticas] + 1, pluvioUsado: prev.pluvioUsado + (usouPluviometro ? 1 : 0) }));
    }

    if (contaCriada && chaveEstatistica !== '') {
      let atualizacoesDB: any = { [chaveEstatistica]: increment(1) };
      if (usouPluviometro) atualizacoesDB.pluvioUsado = increment(1);
      await updateDoc(doc(db, 'usuarios', nomeUsuario), atualizacoesDB);
    }

    const novoAlerta = { 
      coordenada: coordenadaAlerta, 
      titulo: tituloDoPino, 
      icone: nomeDaImagem, 
      categoria: categoria, 
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), 
      autor: nomeUsuario.trim(),
      criadoEm: new Date().getTime(),
      votosConfirma: 0,
      votosResolvido: 0
    };

    try {
      await addDoc(collection(db, 'alertas'), novoAlerta);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      tocarSomDeSucesso(); 
      ganharPontos(pontosGanhos); 
      fecharTudo(); 
      setMilimetrosChuva('');
    } catch (error) { Alert.alert("Erro ao salvar"); }
  };

const votarAlerta = async (idAlerta: string, acao: 'manter' | 'remover') => {
    if (alertasVotados.includes(idAlerta)) { 
      Alert.alert("Aviso", "Você já atualizou este alerta.");
      return; 
    }
    
    try {
      const alertaRef = doc(db, 'alertas', idAlerta);
      const ehOAutor = (nomeUsuario.trim() === alertaSelecionado.autor.trim());
      
      if (acao === 'remover') {
        if (ehOAutor) { 
          await updateDoc(alertaRef, { votosResolvido: 3 });
          // 💡 Removido: Alert de resolvido imediatamente
        } else { 
          await updateDoc(alertaRef, { votosResolvido: increment(1) });
          // 💡 Removido: Alert de registo de atualização
        }
        
        ganharPontos(5);
        tocarSomDeSucesso(); // 👈 Adicionamos o som de sucesso aqui!
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // 👈 E a vibração
        
      } else {
        await updateDoc(alertaRef, { votosConfirma: increment(1) });
        ganharPontos(2);
        tocarSomDeSucesso(); // 👈 Adicionamos o som aqui também!
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // 💡 ÁREA DE AJUDA COMUNITÁRIA (SÓ SE NÃO FOR O AUTOR)
      // (O resto da sua função continua exatamente igual daqui para baixo...)
      if (!ehOAutor) {

         // 1. Calcula o novo número exato de feedbacks
         const novosFeedbacks = (estatisticas.feedbacksDados || 0) + 1;
         
         // 2. Salva no estado e no banco
         setEstatisticas(prev => ({ ...prev, feedbacksDados: novosFeedbacks }));
         if (contaCriada) {
            await updateDoc(doc(db, 'usuarios', nomeUsuario), { feedbacksDados: increment(1) });
         }

         // 3. 🌵 Verifica a evolução passando a SOMA TOTAL de ajudas
         const totalContribuicoes = totalAlertasCriados + novosFeedbacks;
         verificarEvolucaoFazendinha(totalContribuicoes);
         // 💡 SOM DE EVOLUÇÃO (MÁGICO E DISCRETO)
        const tocarSomEvolucao = async () => {
          try {
            // Som estilo brilho/chime (suave e mágico)
            const { sound } = await Audio.Sound.createAsync({ uri: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3' });
            await sound.playAsync();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Vibraçãozinha para acompanhar
          } catch (erro) {}
        };
      }

      setAlertasVotados(prev => [...prev, idAlerta]);
      fecharTudo();
      
    } catch (error) { 
      Alert.alert("Erro ao enviar voto."); 
    }
  };

  const iniciarAlerta = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCoordenadaAlerta({ latitude: localizacao.latitude, longitude: localizacao.longitude });
    setModoSelecaoLocal(true); 
    setAlertaSelecionado(null); 
    setMenuPerfilAberto(false);
  };

  const aoSoltarPino = (novaCoordenada: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCoordenadaAlerta(novaCoordenada); 
    setMenuPrincipalAberto(true);
    setSubmenuAtual(null);
    setOpcaoSelecionada(null);
    Animated.timing(animacaoAba, { toValue: 0, duration: 800, useNativeDriver: true }).start();
  };

  const tocarNoPinoExistente = (alerta: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAlertaSelecionado(alerta);
    setMenuPrincipalAberto(false); 
    setModoSelecaoLocal(false);
    Animated.timing(animacaoAba, { toValue: 0, duration: 400, useNativeDriver: true }).start();
  };

  // 💡 FUNÇÃO PARA ABRIR O AGRUPAMENTO COM ZOOM
  const aproximarZoom = (coordenada: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    mapaRef.current?.animateToRegion({
      latitude: coordenada.latitude,
      longitude: coordenada.longitude,
      latitudeDelta: localizacao.latitudeDelta / 4,
      longitudeDelta: localizacao.longitudeDelta / 4,
    }, 500); 
  };

  // 💡 OPÇÃO 1: Deslizamento por Tempo (Timing)
  const fecharTudo = () => {
    setModoSelecaoLocal(false);
    setSubmenuAtual(null);
    // ... outros estados que você zera aqui ...

    Animated.timing(animacaoAba, {
      toValue: 500, // Move a aba 500 pixels para baixo (escondendo-a)
      duration: 800, // 💡 O SEGREDO AQUI: 200 milissegundos (é bem rápido!)
      useNativeDriver: true,
    }).start(() => {
      setMenuPrincipalAberto(false);
      setAlertaSelecionado(null);
    });
  };

// 💡 DOCUMENTAÇÃO: Função inteligente que decide o que fazer quando o utilizador toca no mapa
  const aoTocarNoMapa = () => {
    
    // CONDIÇÃO 1: A aba do menu está visível na tela?
    if (menuPrincipalAberto || alertaSelecionado) {
      
      setSubmenuAtual(null); // Limpa as opções internas

      // Faz a aba descer devagar
      Animated.timing(animacaoAba, {
        toValue: 500,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setMenuPrincipalAberto(false);
        setAlertaSelecionado(null);
        // 💡 NOTA EDUCATIVA: Repare que NÃO colocámos o setModoSelecaoLocal(false) aqui.
        // Assim, o boneco sobrevive e continua no mapa!
      });
      
    } 
    // CONDIÇÃO 2: A aba já está escondida, mas o boneco ainda está no ecrã?
    else if (modoSelecaoLocal) {
      
      // 💡 Como o menu já desceu no toque anterior, este segundo toque cancela o boneco.
      setModoSelecaoLocal(false);
      
    }
  };

  // 💡 FUNÇÃO PARA CENTRALIZAR O MAPA NO USUÁRIO
  const centralizarNoUsuario = async () => {
    try {
      // Pequena vibração para dar uma sensação de "clique" físico
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Pede a localização atual real do GPS do celular
      let location = await Location.getCurrentPositionAsync({});

      // Pega na "câmera" do mapa e faz ela deslizar até ao usuário
      mapaRef.current?.animateCamera(
        {
          center: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          zoom: 16, // 👈 Pode ajustar de 15 a 19 (quanto maior o número, mais próximo fica)
          heading: 0, // Adicionado para satisfazer a tipagem do TypeScript
          pitch: 0,   // Adicionado para satisfazer a tipagem do TypeScript
        },
        { duration: 1000 } // 1000ms = 1 segundo de animação suave
      );
      
    } catch (error) {
      console.log("Não foi possível obter a localização", error);
    }
  };

  const abrirSubmenu = (menu: string) => {
    Haptics.selectionAsync();
    setSubmenuAtual(menu);
    setOpcaoSelecionada(null);
  };

  // 💡 ESCALAS DINÂMICAS PARA CADA ÍCONE
  const MENU_OPCOES: any = {
    molhada: {
      categoria: 'Passagem', titulo: 'Nível da Água',
      itens: [
        { detalhe: 'Passagem livre', img: 'Passagem_livre', escala: 1.5 },
        { detalhe: 'Água por cima (cuidado)', img: 'Passagem_agua_por_cima', escala: 1.5 },
        { detalhe: 'Água por cima (interditado)', img: 'Passagem_interditada', escala: 1.5 }
      ]
    },
    chuvas: {
      categoria: 'Chuvas', titulo: 'Alerta de Chuva',
      itens: [
        { detalhe: 'Sereno', img: 'Chuva_sereno', escala:1.1 },
        { detalhe: 'Chuva Branda', img: 'Chuva_branda', escala: 1.3 },
        { detalhe: 'Toró sem vento', img: 'Chuva_temporal_semvento', escala: 1.21 },
        { detalhe: 'Toró com vento', img: 'Chuva_temporal_comvento', escala: 1.21 }
      ]
    },
    luz: {
      categoria: 'Energia', titulo: 'Problema de Energia',
      itens: [
        { detalhe: 'Faltou Geral', img: 'Energia1', escala: 1.2, moverEsquerda: 10.4 },
        { detalhe: 'Só na minha rua', img: 'Energia1_rua', escala: 1, moverEsquerda: 4 },
        { detalhe: 'Oscilando / Fraca', img: 'Energia1_osc', escala: 1.1, moverEsquerda:0 }
      ]
    }
  };

  const confirmarAlertaWaze = () => {
     if (!opcaoSelecionada) return;
     const config = MENU_OPCOES[submenuAtual as string];
     registrarAlerta(config.categoria, opcaoSelecionada.detalhe, opcaoSelecionada.img);
  };

  const salvarConta = async () => {
    if(inputNome.trim() === '') { Alert.alert('Ops!', 'Digite um nome.'); return; }
    const apelido = inputNome.trim();
    try {
       const userRef = doc(db, 'usuarios', apelido);
       const userSnap = await getDoc(userRef);
       if (userSnap.exists()) {
         const data = userSnap.data();
         setEstatisticas({
            pluvioUsado: data.pluvioUsado || 0, feedbacksDados: data.feedbacksDados || 0,
            energia_geral: data.energia_geral || 0, energia_rua: data.energia_rua || 0, energia_oscilando: data.energia_oscilando || 0,
            chuva_sereno: data.chuva_sereno || 0, chuva_branda: data.chuva_branda || 0, chuva_toroSem: data.chuva_toroSem || 0, chuva_toroCom: data.chuva_toroCom || 0,
            passagem_livre: data.passagem_livre || 0, passagem_aguaLivre: data.passagem_aguaLivre || 0, passagem_aguaPerigo: data.passagem_aguaPerigo || 0, passagem_interditada: data.passagem_interditada || 0
         });
         setPontos((data.pontos || 0) + pontos);
         let syncUpdates = { pontos: increment(pontos), pluvioUsado: increment(estatisticas.pluvioUsado), feedbacksDados: increment(estatisticas.feedbacksDados) };
         Object.keys(estatisticas).forEach(key => { if(key !== 'pluvioUsado' && key !== 'feedbacksDados') { (syncUpdates as any)[key] = increment(estatisticas[key as keyof typeof estatisticas]); } });
         await updateDoc(userRef, syncUpdates);
       } else { await setDoc(userRef, { pontos: pontos, nome: apelido, ...estatisticas }); }
       setNomeUsuario(apelido); setContaCriada(true); setModoEscolhaLogin(false); setModoEdicaoEmail(false); 
    } catch (error) { Alert.alert("Erro", "Verifique a internet."); }
  };

  // 💡 DOCUMENTAÇÃO: Agora usamos as chaves do dicionário ICONES em vez de emojis
  const niveis = [
    { pts: 0, icone: 'exploradorlevel1', nome: 'Explorador da Caatinga' },
    { pts: 30, icone: 'guialevel2', nome: 'Guia dos Caminhos' },
    { pts: 50, icone: 'sentinelalevel3', nome: 'Sentinela Noturna' },
    { pts: 100, icone: 'guardiaolevel4', nome: 'Guardião do Sertão' },
    { pts: 250, icone: 'senhorlevel5', nome: 'Farol da Comunidade' },
    { pts: 500, icone: 'lendalevel6', nome: 'Lenda da Caatinga' },
    { pts: 1000, icone: 'coroalevel7', nome: 'Coroa do Sertão' },
  ];

  const nivelAtualInfo = [...niveis].reverse().find(n => pontos >= n.pts) || niveis[0];
  const indiceNivel = niveis.findIndex(n => n.nome === nivelAtualInfo.nome);

  const calcularDistintivo = (valor: number, metas: number[]) => {
     let metaAnterior = 0;
     let proximaMeta = metas[metas.length - 1];
     for (let m of metas) { if (valor < m) { proximaMeta = m; break; } metaAnterior = m; }
     const ehMaximo = valor >= metas[metas.length - 1];
     return { nivelBadge: metaAnterior, proximaMeta: proximaMeta, porcentagem: ehMaximo ? 100 : (valor / proximaMeta) * 100, maximo: ehMaximo };
  };

  const listaDistintivos = [
    { id: 'chuva_sereno', icone: 'arauto', titulo: 'Arauto da Garoa', valor: estatisticas.chuva_sereno, metas: [1, 5, 20], cor: '#00ccff', corFundo: '#e6f9ff', categoria: 'Chuvas' },
    { id: 'chuva_branda', icone: 'amigodaterra', titulo: 'Amigo da Terra', valor: estatisticas.chuva_branda, metas: [1, 5, 20], cor: '#00ccff', corFundo: '#e6f9ff', categoria: 'Chuvas' },
    { id: 'chuva_toroSem', icone: 'dancadachuva', titulo: 'Dança da Chuva', valor: estatisticas.chuva_toroSem, metas: [1, 5, 20], cor: '#0066cc', corFundo: '#e6f0ff', categoria: 'Chuvas' },
    { id: 'chuva_toroCom', icone: 'senhordosventos', titulo: 'Senhor dos Ventos', valor: estatisticas.chuva_toroCom, metas: [1, 5, 20], cor: '#000066', corFundo: '#e6e6f2', categoria: 'Chuvas' },
    
    { id: 'energia_geral', icone: 'vigiadobreu', titulo: 'Vigia do Breu', valor: estatisticas.energia_geral, metas: [1, 5, 10], cor: '#333333', corFundo: '#ebebeb', categoria: 'Energia' },
    { id: 'energia_rua', icone: 'sentineladarua', titulo: 'Sentinela da Rua', valor: estatisticas.energia_rua, metas: [1, 5, 10], cor: '#ffcc00', corFundo: '#fff9e6', categoria: 'Energia' },
    { id: 'energia_oscilando', icone: 'cacafaisca', titulo: 'Caça-Faíscas', valor: estatisticas.energia_oscilando, metas: [1, 5, 10], cor: '#ff9900', corFundo: '#fff5e6', categoria: 'Energia' },
    
    { id: 'passagem_livre', icone: '✅', titulo: 'Abre-Alas', valor: estatisticas.passagem_livre, metas: [1, 10, 30], cor: '#28a745', corFundo: '#e6ffea', categoria: 'Passagem' },
    { id: 'passagem_aguaLivre', icone: '🚙', titulo: 'Pneus Molhados', valor: estatisticas.passagem_aguaLivre, metas: [1, 10, 30], cor: '#17a2b8', corFundo: '#e6f7fa', categoria: 'Passagem' },
    { id: 'passagem_aguaPerigo', icone: '⚠️', titulo: 'Vigia das Águas', valor: estatisticas.passagem_aguaPerigo, metas: [1, 10, 30], cor: '#fd7e14', corFundo: '#fff2e6', categoria: 'Passagem' },
    { id: 'passagem_interditada', icone: '🚫', titulo: 'Defensor da Vida', valor: estatisticas.passagem_interditada, metas: [1, 5, 10], cor: '#dc3545', corFundo: '#ffebed', categoria: 'Passagem' },
    { id: 'feedbacksDados', icone: '🤝', titulo: 'Bom Vizinho', valor: estatisticas.feedbacksDados, metas: [1, 10, 50], cor: '#8a2be2', corFundo: '#f4ebff', categoria: 'Especiais' },
    { id: 'pluvioUsado', icone: '📏', titulo: 'A Precisão', valor: estatisticas.pluvioUsado, metas: [1, 5, 20], cor: '#0099ff', corFundo: '#e6f7ff', categoria: 'Especiais' }
  ];

  const totalAlertasCriados = listaDistintivos.filter(d => d.categoria !== 'Especiais').reduce((acc, curr) => acc + curr.valor, 0);
  
  // 💡 O CÉREBRO DA FAZENDINHA ATUALIZADO
  // 💡 O CÉREBRO DA FAZENDINHA (DEMONSTRAÇÃO: MÁX 100 PONTOS)
  const calcularEstagioFazendinha = (pontos: number) => {
    if (pontos >= 12) return { estagio: 13, nome: "Terra Próspera", cor: '#81c784', img: 'fazenda13', frase: "Zerou o jogo, patrão(a)! Sua terra tá tão chique que já pode virar ponto turístico!" };
       if (pontos >= 11) return { estagio: 12, nome: "Novos Ares", cor: '#aed581', img: 'fazenda12', frase: "Tá respirando fundo? É o cheirinho do sucesso e do mato verde batendo na porta!" };
       if (pontos >= 10) return { estagio: 11, nome: "A Colheita", cor: '#c5e1a5', img: 'fazenda11', frase: "Pega o cesto que a fartura chegou! É hora de colher os frutos do seu trabalho!" };
       if (pontos >= 9) return { estagio: 10, nome: "De boa na lagoa", cor: '#dcedc8', img: 'fazenda10', frase: "Sombra, água fresca e a consciência limpa de quem tá ajudando o Sertão!" };   
       if (pontos >= 8) return { estagio: 9, nome: "Força do Vento", cor: '#f1f8e9', img: 'fazenda9', frase: "O vento bateu e o catavento girou!" };
       if (pontos >= 7) return { estagio: 8, nome: "Cocoricó", cor: '#fff9c4', img: 'fazenda8', frase: "Acorda, menino! A galinhada chegou fazendo a maior festa!" };
       if (pontos >= 6) return { estagio: 7, nome: "Meu Aconchego", cor: '#ffe082', img: 'fazenda7', frase: "Eita, que já dá até pra armar uma rede e tirar aquele cochilo bom pós-almoço!" };
       if (pontos >= 5) return { estagio: 6, nome: "O Novo Amigo", cor: '#ffcc80', img: 'fazenda6', frase: "Olha quem apareceu! O primeiro morador oficial!" };
       if (pontos >= 4) return { estagio: 5, nome: "Raízes Fortes", cor: '#ffb74d', img: 'fazenda5', frase: "A árvore tá enraizando! Daqui a pouco vai precisar de um trator pra arrancar!" };
       if (pontos >= 3) return { estagio: 4, nome: "Chuva Abençoada", cor: '#81d4fa', img: 'fazenda4', frase: "Choveu na horta! A terra tá até sorrindo de tanta água!" };
       if (pontos >= 2) return { estagio: 3, nome: "Resiliência", cor: '#b3e5fc', img: 'fazenda3', frase: "Pensa num mato teimoso! Brotou a primeira folhinha, agora ninguém segura!" };
       if (pontos >= 1) return { estagio: 2, nome: "O Primeiro Sopro", cor: '#e1f5fe', img: 'fazenda2', frase: "Opa! Uma brisa bateu e a poeira subiu! O sonho está começando a ganhar vida!" };
       return { estagio: 1, nome: "Início de um Sonho", cor: '#ffe0b2', img: 'fazenda1', frase: "É só terra seca, mas a esperança é a última que morre! Bora ajudar a comunidade!" };
  };

  // 💡 VERIFICADOR DE EVOLUÇÃO
  // Esta função compara se o novo ponto fez o usuário pular de estágio
  const verificarEvolucaoFazendinha = (novasContribuicoes: number) => {
    const infoAntiga = calcularEstagioFazendinha(novasContribuicoes - 1);
    const infoNova = calcularEstagioFazendinha(novasContribuicoes);

    if (infoNova.estagio > infoAntiga.estagio) {
      // 🎉 O USUÁRIO PASSOU DE NÍVEL!
      setModalFazendinhaAberto(true); // Abre o pop-up "Sua terra evoluiu!"
      // (As animações do cacto vão ser ativadas quando ele fechar o pop-up)
    }
  };

  // 💡 O OLHEIRO: Fica observando se os pontos subiram para mostrar o Pop-up
  const totalContribuicoes = totalAlertasCriados + (estatisticas.feedbacksDados || 0);

  useEffect(() => {
      const infoAtual = calcularEstagioFazendinha(totalContribuicoes);

      if (estagioMemoriaRef.current === null) {
          // Primeira vez abrindo o app: apenas memoriza, não mostra pop-up
          estagioMemoriaRef.current = infoAtual.estagio;
      } else if (infoAtual.estagio > estagioMemoriaRef.current) {
          // 🎉 EVOLUIU! O estágio atual é maior que o da memória
          setDadosEvolucao(infoAtual);
          setModalFazendinhaAberto(true);
          estagioMemoriaRef.current = infoAtual.estagio; // Atualiza a memória
          
          // Toca a vibração de sucesso
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Faz a animação da janela a saltar (efeito mola)
          animacaoPopUpFazendinha.setValue(0);
          Animated.spring(animacaoPopUpFazendinha, {
              toValue: 1,
              friction: 5,
              tension: 40,
              useNativeDriver: true
          }).start();
      }
  }, [totalContribuicoes]);
  
  const ehAlertaPositivo = alertaSelecionado?.titulo.includes('Livre') || alertaSelecionado?.titulo.includes('Já voltou');
  const ehOAutorDoAlertaSelecionado = alertaSelecionado && nomeUsuario !== 'Convidado' && (nomeUsuario.trim() === alertaSelecionado.autor.trim());




  return (
    <View style={styles.container}>
      {/* 💡 DOCUMENTAÇÃO: O mapa agora "escuta" o toque na tela. 
          Se o usuário tocar nele, ele chama a função fecharTudo automaticamente! */}
       <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <MapView 
         provider={PROVIDER_GOOGLE}
         ref={mapaRef}
         style={styles.mapa} 
         initialRegion={localizacao}
         customMapStyle={estiloMapaMelhorado}
         showsUserLocation={true}
         onPress={aoTocarNoMapa} 
      >
        {alertasAgrupados.map(grupo => {
          if (grupo.quantidade === 1) {
            return (
              <Marker key={grupo.id} coordinate={grupo.coordenada} anchor={{ x: 0.5, y: 0.5 }} onPress={() => tocarNoPinoExistente(grupo)}>
                 
                 <View style={[styles.pinoNoMapa, { backgroundColor: obterCorCategoria(grupo.categoria) }]}>
                    {ICONES[grupo.icone] ? (
                       <Image 
                          source={ICONES[grupo.icone]} 
                          style={[
                             styles.imagemPino, 
                             // 💡 O SEGREDO ESTÁ AQUI: Se for da categoria Passagem, 
                             // diminuímos a largura e altura só para eles!
                             grupo.categoria === 'Passagem' && { width: 40, height: 40 } 
                          ]} 
                       />
                    ) : (
                       <Text style={{fontSize: 20, textAlign: 'center'}}>{grupo.icone}</Text>
                    )}
                 </View>
                 
              </Marker>
            );
          } else {
            return (
              <Marker key={grupo.id} coordinate={grupo.coordenada} onPress={() => aproximarZoom(grupo.coordenada)}>
                 <View style={styles.pinoAgrupado}>
                    <Text style={styles.textoPinoAgrupado}>{grupo.quantidade}</Text>
                 </View>
              </Marker>
            );
          }
        })}

        {/* 💡 O BONECO (PINO DE ARRASTE COM ÁREA DE TOQUE EXPANDIDA) */}
        {modoSelecaoLocal && (
          <Marker 
            coordinate={coordenadaAlerta} 
            draggable 
            onDragEnd={(e) => aoSoltarPino(e.nativeEvent.coordinate)}
            // 💡 NOTA EDUCATIVA: O Marker já tem uma Hitbox padrão, 
            // mas seus filhos (Views) podem expandir isso no Android.
            anchor={{ x: 0.5, y: 0.5 }}
          >

            {/* 💡 NOVA VIEW: Esta caixa invisível expande a área de toque */}
            <View style={styles.containerInvisivelDoBoneco}>
               <View style={{ alignItems: 'center' }}>
                  <Text style={styles.textoBalaoAviso}>Arraste e solte no local</Text>
                  
                  {/* O pino branco e o boneco continuam aqui dentro */}
                  <View style={[styles.pinoNoMapa, { backgroundColor: 'transparent', elevation: 10, shadowOpacity: 0.5 }]}>
                     <MaterialCommunityIcons name="google-street-view" size={26} color="#e90303" /> 
                  </View>
               </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* 💡 WIDGET DE CLIMA EM TEMPO REAL */}
      {climaAtual && (
        <View style={{
          position: 'absolute',
          top: insets.top + 15, // Fica na mesma altura dos botões da esquerda
          alignSelf: 'center', // Centraliza perfeitamente no topo da tela
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 25,
          flexDirection: 'row',
          alignItems: 'center',
          elevation: 5,
          shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
          zIndex: 10
        }}>
           {/* Lê o código da API e procura no nosso Dicionário. Se não achar, põe uma nuvem padrão */}
           <Text style={{fontSize: 24, marginRight: 8}}>
              {TRADUTOR_CLIMA[climaAtual.weathercode]?.emoji || '☁️'}
           </Text>
           <View>
              <Text style={{fontSize: 15, fontWeight: 'bold', color: '#333'}}>
                 {climaAtual.temperature.toFixed(1)}°C
              </Text>
              <Text style={{fontSize: 10, color: '#666', fontWeight: '600'}}>
                 {TRADUTOR_CLIMA[climaAtual.weathercode]?.texto || 'Indefinido'}
              </Text>
           </View>
        </View>
      )}

      <View style={[styles.botoesEsquerda, { top: insets.top + 15 }]}>
          <TouchableOpacity style={styles.botaoCirculo} onPress={() => { setMenuPerfilAberto(true); setTelaInternaPerfil('principal'); }}>
             <FontAwesome5 name="user-alt" size={20} color="#333" />
             {/*<Image source={ICONES.Usuario} style={{width: 50, height: 50, resizeMode: 'contain'}} />*/}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.botaoCirculo, {marginTop: 15}]} onPress={() => setMenuRankingAberto(true)}>
             <FontAwesome6 name="ranking-star" size={20} color="#333" />
             {/*<Image source={ICONES.Trofeu} style={{width: 45, height: 45, resizeMode: 'contain'}} />*/}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.botaoCirculo, {marginTop: 15}]} onPress={() => setMenuPluviometroAberto(true)}>
             <FontAwesome6 name="prescription-bottle" size={20} color="#333" />
             {/*<Image source={ICONES.Pluviometro} style={{width: 45, height: 45, resizeMode: 'contain'}} />*/}
          </TouchableOpacity>
      </View>

      {/* 💡 NOVO MODAL: Lista de Pluviômetros da Região Visível */}
      <Modal visible={menuPluviometroAberto} animationType="slide" transparent={true}>
        <View style={styles.modalFundo}>
          <View style={styles.modalConteudo}>
            <View style={styles.headerRanking}>
                <Text style={styles.tituloRanking}>Chuvas na Região</Text>
                <TouchableOpacity onPress={() => setMenuPluviometroAberto(false)}>
                   <MaterialIcons name="cancel" size={28} color="#1a1a1a" />
                </TouchableOpacity>
            </View>
          

            <ScrollView>
                {pluviometrosDaRegiao.length === 0 ? (
                   <Text style={{textAlign: 'center', color: 'gray', marginTop: 30}}>Nenhum registro de pluviômetro nesta área do mapa.</Text>
                ) : (
                   pluviometrosDaRegiao.map((alerta: any, index: number) => (
                    <View key={alerta.id} style={styles.itemRanking}>
                      <Text style={[styles.posicao, { color: '#0099ff', width: 30 }]}>{index + 1}º</Text>
                      <View style={{flex: 1}}>
                         <Text style={styles.nomeRanking}>{alerta.autor}</Text>
                         <Text style={{fontSize: 12, color: 'gray'}}>{alerta.hora} • {alerta.titulo.split(' (')[0]}</Text>
                      </View>
                      <Text style={[styles.pontosRanking, { color: '#0099ff', fontSize: 18 }]}>{alerta.milimetros} mm</Text>
                    </View>
                  ))
                )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={menuRankingAberto} animationType="slide" transparent={true}>
        <View style={styles.modalFundo}>
          <View style={styles.modalConteudo}>
            <View style={styles.headerRanking}>
                <Text style={styles.tituloRanking}>Ranking Sertão</Text>
                <TouchableOpacity onPress={() => setMenuRankingAberto(false)}>
                   <MaterialIcons name="cancel" size={28} color="#1a1a1a" />
                </TouchableOpacity>
            </View>
            <ScrollView>
                {ranking.length === 0 ? (
                   <Text style={{textAlign: 'center', color: 'gray', marginTop: 30}}>Ninguém registrou conta no ranking ainda.</Text>
                ) : (
                   ranking.map((user, index) => (
                    <View key={user.id} style={styles.itemRanking}>
                      <Text style={styles.posicao}>{index + 1}º</Text>
                      <Text style={styles.nomeRanking}>{user.nome}</Text>
                      <Text style={styles.pontosRanking}>{user.pontos} pts</Text>
                    </View>
                  ))
                )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* 💡 POP-UP DE CELEBRAÇÃO DA FAZENDINHA (Corrigido) */}
      <Modal visible={modalFazendinhaAberto} animationType="fade" transparent={true}>
        <View style={styles.modalFundo}>
         
          <Animated.View style={[styles.cartaoFazendinhaPopUp, { transform: [{ scale: animacaoPopUpFazendinha }], alignItems: 'center' }]}>
            
            <MaterialCommunityIcons name="party-popper" size={70} color="#333" />
            <Text style={{fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#333'}}>Sua terra evoluiu!</Text>
            
            <Text style={{color: 'gray', textAlign: 'center', marginTop: 5, marginBottom: 20}}>O seu esforço ajudou a comunidade e trouxe nova vida ao seu pedaço de chão.</Text>

            {dadosEvolucao && (
               <View style={[styles.cenarioFazendinha, {width: 260, height: 120, borderRadius: 60, backgroundColor: IMAGENS_FAZENDINHA[dadosEvolucao.img] ? 'transparent' : dadosEvolucao.cor, borderWidth: IMAGENS_FAZENDINHA[dadosEvolucao.img] ? 0 : 3, borderColor: '#4caf50' }]}>
                   {IMAGENS_FAZENDINHA[dadosEvolucao.img] ? (
                      <Image source={IMAGENS_FAZENDINHA[dadosEvolucao.img]} style={{ width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 10 }} />
                  ) : (
                      <Text style={{fontSize: 65, textAlign: 'center'}}>{dadosEvolucao.nome}</Text>
                  )}
               </View>
            )}
            
            <Text style={{fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 15, color: '#4caf50'}}>
               {dadosEvolucao?.nome}
            </Text>

            {/* O onPress animado está agora no lugar correto, DENTRO do botão azul! */}
            <TouchableOpacity 
               style={{backgroundColor: '#0099ff', padding: 15, borderRadius: 25, marginTop: 25, alignItems: 'center'}} 
               onPress={() => {
                  setModalFazendinhaAberto(false);
                  setTemEvolucaoPendente(true); 
                  iniciarAnimacaoBotao(); 
               }}
               >
               <Text style={{color: 'white', fontWeight: 'bold', fontSize: 16}}>Continuar Ajudando</Text>
               </TouchableOpacity>

              </Animated.View>
            </View>
          </Modal>

      
      <Animated.View 
        style={[
          styles.botaoFlutuante, 
          { 
            top:insets.top + 80, 
            transform: [{ translateY: animacaoBotao }] 
          }
        ]}
      >
        <TouchableOpacity 
          onPress={() => {
            // Se a bolinha vermelha estava lá, avisa a tela cheia para fazer a mágica!
            setDeveAnimarFazenda(false);
            setModalFazendinhaTelaAberto(true); // Abre a tela da fazenda
            setTemEvolucaoPendente(false);      // Remove a bolinha vermelha
            pararAnimacaoBotao();               // Faz o botão parar de pular
          }}
        >
          {/* O ícone do cacto */}
          {/*<Image 
             source={ICONES.FazendaIcone} 
             style={{ width: 40, height: 42, resizeMode: 'contain' }} 
          /> */}

          <MaterialCommunityIcons name="tree" size={45} color="#007423" />

          {temEvolucaoPendente && (
            <View style={{
              position: 'absolute', 
              top: -2, 
              right: -2, 
              width: 18, 
              height: 18, 
              backgroundColor: '#ff5252', 
              borderRadius: 9, 
              borderWidth: 2, 
              borderColor: 'white',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
               <View style={{width: 6, height: 6, backgroundColor: 'white', borderRadius: 3}} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* 💡 TELA CHEIA DA FAZENDINHA: FOCO NO CENÁRIO (Atualizado) */}
      <Modal visible={modalFazendinhaTelaAberto} animationType="slide" transparent={false}>
        <View style={{flex: 1, backgroundColor: 'white'}}>
           
           {/* Botão de Fechar - Mais minimalista */}
           <View style={{position: 'absolute', top: 50, left: 20, zIndex: 10}}>
              <TouchableOpacity 
            onPress={() => setModalFazendinhaTelaAberto(false)} 
            
         >
            <MaterialIcons name="cancel" size={28} color = "#1a1a1a" />
         </TouchableOpacity>
           </View>

           {(() => {
              // Lógica de cálculo (reutilizada)
              const contribuicoes = totalAlertasCriados + (estatisticas.feedbacksDados || 0);
              const infoAtual = calcularEstagioFazendinha(contribuicoes);
              
              // Lógica de cálculo da próxima meta (Escala 100 pontos)
              let proxMeta = 12; // Meta máxima final (Fase 13)
              if (infoAtual.estagio === 1) proxMeta = 1;
              else if (infoAtual.estagio === 2) proxMeta = 2;
              else if (infoAtual.estagio === 3) proxMeta = 3;
              else if (infoAtual.estagio === 4) proxMeta = 4;
              else if (infoAtual.estagio === 5) proxMeta = 5;
              else if (infoAtual.estagio === 6) proxMeta = 6;
              else if (infoAtual.estagio === 7) proxMeta = 7;
              else if (infoAtual.estagio === 8) proxMeta = 8;
              else if (infoAtual.estagio === 9) proxMeta = 9;
              else if (infoAtual.estagio === 10) proxMeta = 10;
              else if (infoAtual.estagio === 11) proxMeta = 11;
              else if (infoAtual.estagio === 12) proxMeta = 12;

              const porcentagem = contribuicoes >= 12 ? 100 : (contribuicoes / proxMeta) * 100;

              return (
                 <>
                   {/* 🌟 METADE SUPERIOR: O GRANDE CENÁRIO (Agora ocupa 70% da tela!) */}
                   <View style={{height: '78%', backgroundColor: infoAtual.cor, justifyContent: 'center', alignItems: 'center'}}>
                      {IMAGENS_FAZENDINHA[infoAtual.img] ? (
                      <ImagemFazendinhaAnimada imagemAtual={infoAtual.img} />
                      ) : (
                          <Text style={{fontSize: 40, textAlign: 'center', fontWeight: 'bold', color: 'gray'}}>{infoAtual.nome}</Text>
                      )}
                   </View>

                   {/* ⚪ METADE INFERIOR: A ABA BRANCA (Ajustada) */}
                   <View style={{
                      height: '22%', // Aumentado um pouquinho (de 30% para 32%) para acomodar o texto
                      paddingHorizontal: 25, 
                      paddingVertical: 20, 
                      backgroundColor: 'white', 
                      borderTopLeftRadius: 35, 
                      borderTopRightRadius: 35, 
                      marginTop: -35, 
                      elevation: 15, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10,
                      justifyContent: 'space-between' // Distribui o Título, o Texto e a Barra perfeitamente
                   }}>
                       
                       <View style={{alignItems: 'center'}}>
                          {/* Marcador de deslize */}
                          <View style={{backgroundColor: '#eee', width: 40, height: 4, borderRadius: 2, marginBottom: 15}} />
                          
                          <Text style={{fontSize: 10, color: 'gray', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 1.5}}>Estágio {infoAtual.estagio}</Text>
                          <Text style={{fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 3}}>{infoAtual.nome}</Text>
                       </View>
                       
                       {/* 💡 O NOVO TEXTO LÚDICO E AMIGÁVEL */}
                       <Text style={{fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 15, fontStyle: 'italic', lineHeight: 16}}>
                          {infoAtual.frase}
                       </Text>

                       {/* Barra de Progresso e Texto */}
                       <View>
                           <View style={{ width: '100%', height: 8, borderRadius: 6, backgroundColor: '#f0f0f0', marginBottom: 6, overflow: 'hidden' }}>
                              <View style={{width: `${porcentagem}%`, height: '100%', backgroundColor: '#4caf50', borderRadius: 6}} />
                           </View>

                           {/* 💡 Mudamos de "ajudas" para "gotas de ajuda" para combinar com a narrativa */}
                           <Text style={{fontSize: 12, color: '#4caf50', fontWeight: 'bold', textAlign: 'center'}}>
                              {contribuicoes >= 100 
      ? '✨ Oásis Conquistado! ✨' 
      : (proxMeta - contribuicoes) === 1 
         ? 'Falta 1 ajuda para evoluir a terra' 
         : `Faltam ${proxMeta - contribuicoes} ajudas para evoluir a terra`
    }
                           </Text>
                       </View>

                   </View>
                 </>
              );
           })()}
        </View>
      </Modal>      

      {/* 💡 MENU PERFIL REFORMULADO (TUDO NA MESMA TELA) */}
      {menuPerfilAberto && (
        <View style={styles.telaPerfilWaze}>
            
            {/* CABEÇALHO */}
            <View style={styles.cabecalhoPerfil}>
                {telaInternaPerfil !== 'principal' ? (
                   <TouchableOpacity onPress={() => setTelaInternaPerfil('principal')} style={{padding: 10}}>
                    <Ionicons name="arrow-back-circle" size={30} color="#1a1a1a" />
                   </TouchableOpacity>
                ) : <View style={{width: 40}} /> }
                
                <Text style={styles.tituloCabecalho}>
                   {telaInternaPerfil === 'sobre' ? 'Sobre o App' : 'Perfil do Sertão'}
                </Text>
                <TouchableOpacity 
             onPress={() => setMenuPerfilAberto(false)} // 👈 Usando a função correta
             style={{
                marginBottom: 15,
             }}
              >
                <MaterialIcons name="cancel" size={28} color="#1a1a1a" />
              </TouchableOpacity>
          
            </View>

            {/* TELA PRINCIPAL CONSOLIDADA */}
            {telaInternaPerfil === 'principal' && (
              <ScrollView style={{flex: 1, backgroundColor: '#f4f5f7'}}>
                  
                  {/* 1. APRESENTAÇÃO E CONQUISTAS INTEGRADAS */}
                  <View style={styles.mensagemTopo}>
                      <Image 
                         source={ICONES[nivelAtualInfo.icone] || ICONES.Usuario} 
                         style={{width: 110, height: 110, marginBottom: 10, resizeMode: 'contain'}} 
                      />
                      <Text style={{fontSize: 22, fontWeight: 'bold'}}>Olá, {nomeUsuario}!</Text>
                      <Text style={{color: '#666', textAlign: 'center', marginTop: 5}}>Nível: {nivelAtualInfo.nome}</Text>
                      
                      {/* Resumo de Conquistas Direto no Topo */}
                      <View style={{flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 25, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee'}}>
                         <View style={{alignItems: 'center'}}>
                            <Text style={{fontSize: 28, fontWeight: 'bold', color: '#0099ff'}}>{totalAlertasCriados + (estatisticas.feedbacksDados || 0)}</Text>
                            <Text style={{color: 'gray', fontSize: 13}}>Ajudas dadas</Text>
                         </View>
                         <View style={{alignItems: 'center'}}>
                            <Text style={{fontSize: 28, fontWeight: 'bold', color: '#ffcc00'}}>{pontos}</Text>
                            <Text style={{color: 'gray', fontSize: 13}}>Pontos Totais</Text>
                         </View>
                      </View>
                  </View>

                  {/* 2. GAVETA DE CRIAR CONTA / STATUS DA CONTA */}
                  <View style={{backgroundColor: 'white', marginTop: 10, padding: 25}}>
                      {!contaCriada && !modoEscolhaLogin && !modoEdicaoEmail && (
                         <View style={{alignItems: 'center'}}>
                            <Text style={{fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5}}>Junte-se ao Ranking</Text>
                            <Text style={{color: 'gray', marginBottom: 15, textAlign: 'center', lineHeight: 20}}>Crie uma conta para salvar as suas conquistas e fazer parte da comunidade.</Text>
                            <TouchableOpacity style={styles.botaoAzulConta} onPress={() => setModoEscolhaLogin(true)}>
                               <Text style={{color: 'white', fontWeight: 'bold', fontSize: 16}}>Criar conta agora</Text>
                            </TouchableOpacity>
                         </View>
                      )}
                      
                      {!contaCriada && modoEscolhaLogin && !modoEdicaoEmail && (
                         <View style={{width: '100%'}}>
                            <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'center'}}>Escolha como entrar:</Text>
                            <TouchableOpacity style={[styles.botaoLogin, styles.btnEmail]} onPress={() => setModoEdicaoEmail(true)}>
                               <Text style={{fontSize: 20, marginRight: 10}}>✉️</Text>
                               <Text style={styles.textoBotaoLoginEscuro}>Entrar com Apelido</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setModoEscolhaLogin(false)} style={{marginTop: 15}}>
                               <Text style={{textAlign: 'center', color: 'gray', fontWeight: 'bold'}}>Cancelar</Text>
                            </TouchableOpacity>
                         </View>
                      )}

                      {!contaCriada && modoEdicaoEmail && (
                         <View style={{width: '100%'}}>
                            <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center'}}>Nome de Explorador</Text>
                            <TextInput style={styles.caixaTextoNome} placeholder="Ex: MariaSertão" value={inputNome} onChangeText={setInputNome} autoFocus={true} />
                            <TouchableOpacity style={styles.botaoAzulConta} onPress={salvarConta}>
                               <Text style={{color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center'}}>Salvar Perfil</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {setModoEdicaoEmail(false); setModoEscolhaLogin(true)}} style={{marginTop: 15}}>
                               <Text style={{textAlign: 'center', color: 'gray', fontWeight: 'bold'}}>Voltar</Text>
                            </TouchableOpacity>
                         </View>
                      )}

                      {contaCriada && (
                         <View style={{alignItems: 'center'}}>
                            <Text style={{color: '#28a745', fontWeight: 'bold', fontSize: 16, marginBottom: 15}}>✅ Conta sincronizada</Text>
                            <TouchableOpacity onPress={() => {
                                Alert.alert("Sair da Conta", "Tem a certeza que deseja sair?", [
                                  { text: "Cancelar", style: "cancel" },
                                  { text: "Sair", style: "destructive", onPress: () => { setContaCriada(false); setNomeUsuario('Convidado'); setModoEscolhaLogin(false); setModoEdicaoEmail(false); } }
                                ]);
                            }}>
                              <Text style={{color: '#ff4444', fontWeight: 'bold'}}>Sair da conta</Text>
                            </TouchableOpacity>
                         </View>
                      )}
                  </View>

                  {/* 3. CARROSSEL DA JORNADA (Níveis) */}
                  <View style={{backgroundColor: 'white', marginTop: 10, paddingVertical: 20}}>
                     <Text style={{fontSize: 16, fontWeight: 'bold', marginLeft: 20, marginBottom: 15}}>Sua Evolução</Text>
                     
                     <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                          {niveis.map((n, i) => {
                            const ehOAtual = i === indiceNivel;
                            const jaPassou = i < indiceNivel;
                            
                            return (
                              <View key={i} style={{alignItems: 'center', opacity: (ehOAtual || jaPassou) ? 1 : 0.3, marginHorizontal: 12, width: 100 }}>
                                 
                                 {/* 💡 CAIXA DA IMAGEM: Garante que a bolinha de ✓ fica colada ao avatar */}
                                 {/* 💡 CAIXA DA IMAGEM: Aumentada para 105 */}
                                 <View style={{ width: ehOAtual ? 105 : 75, height: ehOAtual ? 105 : 75 }}>
                                     
                                     {ehOAtual && (
                                        <View style={[styles.marcaVerificador, { 
                                           top: 0, // 💡 O 0 garante que fica encostado no teto sem passar
                                           right: 0, // 💡 O 0 encosta na parede direita sem passar
                                           width: 26, // 💡 Aumentei um pouquinho (para 26) para acompanhar o tamanho 105
                                           height: 26, 
                                           borderRadius: 13, 
                                           zIndex: 10, // 💡 Força a bolinha a ficar sempre por cima da imagem
                                           elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3 
                                        }]}>
                                           <Text style={{color: 'white', fontSize: 13, fontWeight: 'bold'}}>✓</Text>
                                        </View>
                                     )}
                                     
                                     <Image source={ICONES[n.icone]} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                                 </View>

                                 {/* TEXTO: Agora tem largura fixa para não espremer a imagem */}
                                 <Text style={{fontSize: 11, marginTop: 10, color: ehOAtual ? '#333' : '#777', fontWeight: ehOAtual ? 'bold' : 'normal', textAlign: 'center'}}>
                                    {n.nome}
                                 </Text>
                                 
                              </View>
                            );
                          })}
                     </ScrollView>
                  </View>

                  {/* 4. GAVETA: SOBRE O APP */}
                  <View style={{ marginTop: 10, marginBottom: 40, backgroundColor: 'white' }}>
                     <TouchableOpacity style={styles.itemMenuLinha} onPress={() => setTelaInternaPerfil('sobre')}>
                         <View style={{flexDirection: 'row', alignItems: 'center'}}>
                          <MaterialIcons name="info" size={20} color="#333" style={{ marginRight: 15 }} />
                            <Text style={{fontSize: 16, fontWeight: 'bold', color: '#333'}}>Sobre o App</Text>
                         </View>
                         <Ionicons name="arrow-forward-circle" size={25} color="#1a1a1a" />
                     </TouchableOpacity>
                  </View>

              </ScrollView>
            )}

            {/* TELA: SOBRE O APP */}
            {telaInternaPerfil === 'sobre' && (
              <ScrollView style={{flex: 1, backgroundColor: 'white', padding: 25}}>
                 {/* 💡 COLOQUE O BOTÃO DE VOLTAR AQUI, NO TOPO DA TELA SOBRE O APP */}
                <TouchableOpacity 
                    onPress={() => setTelaInternaPerfil('principal')} 
                    style={{
                      marginBottom: 15,
                    }}
                >
                    {/* 💡 Ícone de Voltar (Ionicons) */}
                   
                 </TouchableOpacity>
                 
                 <View style={{alignItems: 'center', marginBottom: 25, marginTop: 10}}>
                    <Text style={{fontSize: 60}}>🌵</Text>
                    <Text style={{fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 10}}>Meu Alerta</Text>
                    <Text style={{color: '#0099ff', fontWeight: 'bold', fontSize: 14, marginTop: 5}}>Conectar para transformar</Text>
                 </View>
                 
                 <Text style={{fontSize: 15, color: '#555', lineHeight: 24, textAlign: 'justify', marginBottom: 15}}>
                    O <Text style={{fontWeight: 'bold'}}>Meu Alerta</Text> nasceu de um propósito simples, mas muito importante: cuidar de quem a gente ama. Criado como um projeto de inovação por alunos da <Text style={{fontWeight: 'bold'}}>EEMTI Maria Vieira de Pinho</Text>, o app transforma a tecnologia numa verdadeira rede de apoio comunitário.
                 </Text>
                 
                 <Text style={{fontSize: 15, color: '#555', lineHeight: 24, textAlign: 'justify', marginBottom: 15}}>
                    Quem vive na nossa região conhece bem os desafios climáticos e de infraestrutura. Estradas alagadas ou quedas de energia afetam o nosso dia a dia e a nossa segurança. 
                 </Text>

                 <Text style={{fontSize: 15, color: '#555', lineHeight: 24, textAlign: 'justify', marginBottom: 25}}>
                    Para resolver isso, o Alerta Sertão funciona como um radar colaborativo. Você pode avisar se uma passagem está alagada ou se falta luz, ajudando o próximo a fazer um trajeto mais seguro. É a nossa comunidade conectada!
                 </Text>

                 <View style={{backgroundColor: '#f4f5f7', padding: 7, borderRadius: 15, alignItems: 'center'}}>
                    {/*<Text style={{fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8}}>Projeto Escolar Colaborativo</Text>*/}
                    {/*<Text style={{fontSize: 16, color: '#0099ff', fontWeight: 'bold', textAlign: 'center'}}>EEMTI Maria Vieira de Pinho 💡</Text>*/}
                    <Text style={{fontSize: 12, color: '#999', marginTop: 0}}>© 2026 - Todos os direitos reservados</Text>
                 </View>
                 <View style={{height: 50}} />
              </ScrollView>
            )}

        </View>
      )}

      {/* 💡 NOVO BOTÃO: Centralizar no Usuário */}
      {!modoSelecaoLocal && !alertaSelecionado && !menuPerfilAberto && !menuPrincipalAberto && (
        <TouchableOpacity 
          style={{
            position: 'absolute',
            bottom: 40,
            left: 20, 
            backgroundColor: 'white',
            width: 50,
            height: 50,
            borderRadius: 25,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5, 
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
          }}
          onPress={centralizarNoUsuario}
        >
          <MaterialIcons name="my-location" size={26} color="#0099ff" />
        </TouchableOpacity>
      )}

      {!modoSelecaoLocal && !alertaSelecionado && !menuPerfilAberto && (
        <TouchableOpacity style={styles.botaoAviso} onPress={iniciarAlerta}>
          <Foundation name="alert" size={50} color="#333333" style={{ marginTop: -7 }} />
          {/*<Image source={ICONES.Alertar} style={{width: 55, height: 55, resizeMode: 'contain'}} />*/}
        </TouchableOpacity>
      )}

      <Animated.View style={[styles.abaInferior, { transform: [{ translateY: animacaoAba }] }]}>
          
        {alertaSelecionado && (
        <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1c1c1e', // 💡 Fundo escuro
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 35, // Espaço extra para a barra de navegação do celular
        elevation: 20,
    }}>
        
        {/* LINHA SUPERIOR: Textos na esquerda, Ícone na direita */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            
            {/* Coluna da Esquerda */}
            <View style={{ flex: 1, paddingRight: 15 }}>
                <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
                    {alertaSelecionado.titulo.split(':')[1] || alertaSelecionado.titulo}
                </Text>

                <Text style={{ color: '#a0a0a0', fontSize: 14, marginTop: 5 }}>
                    {alertaSelecionado.quantidade > 1 
                        ? `${alertaSelecionado.quantidade} pessoas reportaram` 
                        : `Por ${alertaSelecionado.autor}`}
                </Text>
            </View>

            {/* Coluna da Direita (Ícone Gigante Estilo Waze) */}
            <View style={{
                backgroundColor: '#ffcc00', // Fundo amarelo
                width: 70, 
                height: 70, 
                borderRadius: 35, // Círculo perfeito
                borderWidth: 3, 
                borderColor: 'white', 
                justifyContent: 'center', 
                alignItems: 'center',
            }}>
                {/* 💡 Mantivemos a sua lógica de imagem, mas dentro do círculo novo! */}
                {ICONES[alertaSelecionado.icone] ? (
                    <Image source={ICONES[alertaSelecionado.icone]} style={{width: 55, height: 55}} />
                ) : (
                    <Foundation name="alert" size={40} color="#1a1a1a" style={{ marginTop: -2 }} />
                )}
            </View>

        </View>

        {/* LINHA INFERIOR: Botões com Ionicons */}
    <View style={{ flexDirection: 'row', marginTop: 25, gap: 10, justifyContent: 'center' }}>
        {ehOAutorDoAlertaSelecionado ? (
            <TouchableOpacity 
                style={{ flex: 1, backgroundColor: '#333333', paddingVertical: 14, borderRadius: 25, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} 
                onPress={() => votarAlerta(alertaSelecionado.id, 'remover')}
            >
                <Ionicons name="thumbs-up" size={18} color="white" />
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15, marginLeft: 8 }}>Já resolveu!</Text>
            </TouchableOpacity>
        ) : (
            ehAlertaPositivo ? (
                <>
                    <TouchableOpacity 
                        style={{ flex: 1, backgroundColor: '#e22727', paddingVertical: 14, borderRadius: 25, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} 
                        onPress={() => votarAlerta(alertaSelecionado.id, 'manter')}
                    >
                        <FontAwesome name="thumbs-down" size={18} color="white" />
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15, marginLeft: 8 }}>Piorou</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={{ flex: 1, backgroundColor: '#1a94cd', paddingVertical: 14, borderRadius: 25, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} 
                        onPress={() => votarAlerta(alertaSelecionado.id, 'remover')}
                    >
                        <FontAwesome name="thumbs-up" size={18} color="white" />
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15, marginLeft: 8 }}>Continua Livre</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <TouchableOpacity 
                        style={{ flex: 1, backgroundColor: '#e22727', paddingVertical: 14, borderRadius: 25, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} 
                        onPress={() => votarAlerta(alertaSelecionado.id, 'manter')}
                    >
                        <FontAwesome name="thumbs-down" size={18} color="white" />
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15, marginLeft: 8 }}>Ainda está assim</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={{ flex: 1, backgroundColor: '#1a94cd', paddingVertical: 14, borderRadius: 25, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }} 
                        onPress={() => votarAlerta(alertaSelecionado.id, 'remover')}
                    >
                        <FontAwesome name="thumbs-up" size={18} color="white" />
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15, marginLeft: 8 }}>Já resolveu</Text>
                    </TouchableOpacity>
                </>
            )
        )}
    </View>
    </View>
    )}

          {menuPrincipalAberto && !alertaSelecionado && (
            <View>
                <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20}}>
                    <Text style={{fontSize: 20, fontWeight: 'bold'}}>
                        {submenuAtual === null ? 'O que você quer alertar?' : MENU_OPCOES[submenuAtual].titulo}
                    </Text>
                </View>

                {/* PARTE 1: MENU PRINCIPAL */}
                {submenuAtual === null && (
                    <View style={styles.areaBotoesGrade}>
                        <TouchableOpacity style={styles.wazeOptionContainer} onPress={() => abrirSubmenu('chuvas')}>
                            <View style={styles.wazeIconCircle}>
                                <Image source={ICONES.Chuva} style={[styles.wazeIconImg, { transform: [{ scale: 1.1 }] }]} />
                            </View>
                            <Text style={styles.wazeOptionText}>Tempo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.wazeOptionContainer} onPress={() => abrirSubmenu('molhada')}>
                            <View style={styles.wazeIconCircle}>
                                <Image source={ICONES.Passagem_molhada} style={[styles.wazeIconImg, { transform: [{ scale: 1.0 }] }]} />
                            </View>
                            <Text style={styles.wazeOptionText}>Paasagem Molhada</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.wazeOptionContainer} onPress={() => abrirSubmenu('luz')}>
                            <View style={styles.wazeIconCircle}>
                                <Image source={ICONES.Energia} style={[styles.wazeIconImg, { transform: [{ scale: 1.23 }] }]} />
                            </View>
                            <Text style={styles.wazeOptionText}>Falta de Luz</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* PARTE 2: SUBMENUS */}
                {submenuAtual !== null && (
                    <View>
                        <View style={styles.areaBotoesGrade}>
                            {MENU_OPCOES[submenuAtual].itens.map((item: any, index: number) => {
                                const isSelected = opcaoSelecionada?.detalhe === item.detalhe;
                                return (
                                    <TouchableOpacity key={index} style={styles.wazeOptionContainer} onPress={() => { Haptics.selectionAsync(); setOpcaoSelecionada(item); }}>
                                        <View style={[styles.wazeIconCircle, isSelected && styles.wazeIconCircleSelected]}>
                                            <Image 
                                                source={ICONES[item.img]} 
                                                style={[
                                                    styles.wazeIconImg, 
                                                    { 
                                                        transform: [{ scale: item.escala ? item.escala : 1.0 }],
                                                        marginLeft: item.moverDireita ? item.moverDireita : 0,
                                                        marginRight: item.moverEsquerda ? item.moverEsquerda : 0,
                                                        marginTop: item.moverBaixo ? item.moverBaixo : 0,
                                                        marginBottom: item.moverCima ? item.moverCima : 0
                                                    } 
                                                ]} 
                                            />
                                            {isSelected && <View style={styles.checkAzul}><Text style={{color: 'white', fontSize: 10, fontWeight: 'bold'}}>✓</Text></View>}
                                        </View>
                                        <Text style={styles.wazeOptionText}>{item.detalhe}</Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>

                        {/* CAIXA DE TEXTO DO PLUVIÔMETRO */}
                        {submenuAtual === 'chuvas' && (
                            <KeyboardAvoidingView style={{alignItems: 'center', marginVertical: 10}}>
                                <Text style={{fontWeight: 'bold', color: '#555', marginBottom: 5}}>Pluviômetro (Opcional)</Text>
                                <TextInput style={styles.caixaTexto} placeholder="Ex: 15 mm" keyboardType="numeric" returnKeyType="done" value={milimetrosChuva} onChangeText={setMilimetrosChuva} />
                            </KeyboardAvoidingView>
                        )}

                        {/* BOTÕES DE CANCELAR E ALERTAR */}
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 15}}>
                            <TouchableOpacity style={styles.btnWazeCancelar} onPress={() => setSubmenuAtual(null)}>
                                <Text style={styles.btnWazeCancelarTxt}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btnWazeAlertar, {opacity: opcaoSelecionada ? 1 : 0.4}]} onPress={confirmarAlertaWaze} disabled={!opcaoSelecionada}>
                                <Text style={styles.btnWazeAlertarTxt}>Alertar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 💡 ESTILOS DA FAZENDINHA
  cartaoFazendinha: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 3, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  tituloFazendinha: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center'
  },
  cenarioFazendinha: {
    height: 140, 
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
  },

  // Estilo do Pop-up Animado
  cartaoFazendinhaPopUp: {
    backgroundColor: 'white',
    width: '85%',
    borderRadius: 20,
    padding: 25,
    elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10,
  },

  botaoFlutuante: {
    position: 'absolute',
    right: 20, // Mantém do lado direito da tela
    width: 60,
    height: 60,
    borderRadius: 30, // Deixa bem redondinho
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Sombreado no Android
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, // Sombreado no iPhone
    zIndex: 10,
  },

  container: { flex: 1 },
  // 💡 NOVO ESTILO: Cria uma "caixa invisível" gigante ao redor do boneco
  containerInvisivelDoBoneco: {
    // 💡 O SEGREDO ESTÁ AQUI:
    // Adicionamos 40 pixels de área de toque extra em TODOS os lados do pino branco.
    padding: 40, 
    
    // Mantemos transparente para o usuário não ver a caixa
    backgroundColor: 'transparent', 
    
    // Garante que o boneco branco continue centralizado na caixa gigante
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapa: { width: '100%', height: '100%' },
  
  // 💡 BOTÕES FLUTUANTES (COM SOMBRA NO IPHONE)
  botoesEsquerda: { position: 'absolute', top: 60, left: 20 },
  botaoCirculo: { backgroundColor: 'white', width: 40, height: 40, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  botaoAviso: { position: 'absolute', bottom: 40, right: 20, backgroundColor: '#ffd500', width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', borderWidth: 0, borderColor: '#ffcc00', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 6 },
  

  
// 💡 DOCUMENTAÇÃO: Estilo da aba do menu transformada em um "Cartão Flutuante"
  abaInferior: { 
    position: 'absolute', 
    
    // 1. ESPAÇAMENTO E POSICIONAMENTO
    bottom: 0, // Descola a aba 30 pixels do fundo do telemóvel
    alignSelf: 'center', // Garante que o cartão fica perfeitamente no meio
    width: '100%', // Deixa uma margem lateral de 4% de cada lado onde o mapa aparece
    
    backgroundColor: 'white', 
    padding: 25, 
    
    // 2. ARREDONDAMENTO
    borderTopLeftRadius: 30,  // Arredonda o canto superior esquerdo
    borderTopRightRadius: 30, // Arredonda o canto superior direito
    
    // 3. EFEITO FLUTUANTE (SOMBRAS)
    // Sombra para aparelhos Android
    elevation: 15, 
    
    // Sombras para aparelhos iOS (Apple)
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -8 }, // Joga a sombra ligeiramente para cima
    shadowOpacity: 0.25, // Transparência da sombra (0.0 a 1.0)
    shadowRadius: 10, // O quão "espalhada" ou "borrada" a sombra é
  },

  // 💡 PASSO 1: COLAR O ESTILO NOVO AQUI
  // Este é o estilo que criámos do zero para o botão de fechar do menu principal
  botaoFecharElegante: {
    backgroundColor: '#f0f2f5', // Um cinza bem clarinho e moderno
    width: 36,
    height: 36,
    borderRadius: 18, // Metade de 36 para criar um círculo perfeito
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 💡 PASSO 2: ATUALIZAR O btnX QUE JÁ EXISTIA
  // Agora o btnX do alerta selecionado tem as mesmas propriedades do botão elegante
  btnX: { 
    position: 'absolute', 
    top: -5, 
    right: 0, 
    backgroundColor: '#f0f2f5', 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 10 
  },
  
  // 💡 PINOS DO MAPA (REDIMENSIONADOS)
  pinoNoMapa: { backgroundColor: 'white', borderRadius: 17, borderWidth: 0.5, borderColor: '#d6d6d6', width: 30, height: 30, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: 'transparent', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius:10 },
  imagemPino: { width: 35, height: 35, resizeMode: 'contain' },
  badgeNotificacao: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 9, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'white', zIndex: 10 },
  textoBadge: { color: 'white', fontSize: 9, fontWeight: 'bold' },
  textoBalaoAviso: { backgroundColor: 'black', color: 'white', padding: 5, borderRadius: 5, fontSize: 12, marginBottom: 5 },

  // 💡 ESTILO DO CLUSTERING (BOLHA AZUL)
  pinoAgrupado: { 
    backgroundColor: 'rgb(255, 208, 0)', // 💡 Azul levemente transparente (85%)
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2.5, // 💡 Borda mais fina e elegante
    borderColor: 'white', 
    elevation: 4, 
    //shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8 
  },
  textoPinoAgrupado: { color: 'white', fontSize: 10, fontWeight: 'bold'  },
  
  // 💡 ELEMENTOS DO MENU DE INTERFACE WAZE
  areaBotoesGrade: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: '5%' },
  wazeOptionContainer: { width: '30%', alignItems: 'center', marginBottom: 15 },
  wazeIconCircle: { width: 65, height: 65, borderRadius: 35, backgroundColor: '#f0f2f5', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  wazeIconCircleSelected: { borderColor: '#007aff', backgroundColor: '#e6f2ff' },
  // 💡 ESTILO BASE DA IMAGEM RESTAURADO AQUI
  wazeIconImg: { width: 60, height: 60, resizeMode: 'contain' },
  wazeOptionText: { fontSize: 12, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 8 },
  checkAzul: { position: 'absolute', top: -2, right: -2, backgroundColor: '#007aff', width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'white', alignItems: 'center', justifyContent: 'center' },
  
  btnWazeCancelar: { backgroundColor: '#f0f2f5', padding: 15, borderRadius: 25, flex: 0.45, alignItems: 'center' },
  btnWazeCancelarTxt: { color: '#007aff', fontWeight: 'bold', fontSize: 16 },
  btnWazeAlertar: { backgroundColor: '#007aff', padding: 15, borderRadius: 25, flex: 0.5, alignItems: 'center' },
  btnWazeAlertarTxt: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  caixaTexto: { backgroundColor: '#f0f4f8', padding: 10, borderRadius: 10, width: 120, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  btnConfirma: { backgroundColor: '#fff3cd', padding: 15, borderRadius: 15, flex: 1, borderWidth: 1, borderColor: '#ffeeba' },
  btnResolve: { backgroundColor: '#d4edda', padding: 15, borderRadius: 15, flex: 1, borderWidth: 1, borderColor: '#c3e6cb' },
  textoBotaoAcao: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#155724' },
  textoBotaoAcaoErr: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#856404' },
  containerChuvaLikes: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 200 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalConteudo: { backgroundColor: 'white', width: '85%', height: '60%', borderRadius: 20, padding: 20 },
  headerRanking: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  tituloRanking: { fontSize: 22, fontWeight: 'bold' },
  itemRanking: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  posicao: { fontSize: 18, fontWeight: 'bold', width: 40, color: '#ffcc00' },
  nomeRanking: { flex: 1, fontSize: 16 },
  pontosRanking: { fontWeight: 'bold', color: '#666' },
  telaPerfilWaze: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white', zIndex: 100 },
  cabecalhoPerfil: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingTop: 50, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tituloCabecalho: { fontSize: 18, fontWeight: 'bold' },
  cartaoConvidado: { backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  botaoAzulConta: { backgroundColor: '#0099ff', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  itemMenuLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  separador: { height: 10, backgroundColor: '#f4f5f7' },
  caixaTextoNome: { backgroundColor: '#f4f5f7', padding: 15, borderRadius: 10, width: '100%', fontSize: 16, marginBottom: 15, textAlign: 'center' },
  botaoLogin: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 10, marginBottom: 10, width: '100%', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd' },
  btnEmail: { backgroundColor: '#f0f4f8' },
  textoBotaoLoginEscuro: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  mensagemTopo: { padding: 30, alignItems: 'center', backgroundColor: 'white' },

  marcaVerificador: { position: 'absolute', top: -5, right: -5, backgroundColor: '#0099ff', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  badgeCardGrelha: { width: '31%', alignItems: 'center', marginBottom: 10 },
  badgeNomeGrelha: { fontSize: 11, color: '#444', marginBottom: 5, fontWeight: 'bold', textAlign: 'center' },
  badgeIconeFundoGrelha: { backgroundColor: '#f8f9fa', borderWidth: 2, borderColor: '#eee', borderRadius: 15, alignItems: 'center', justifyContent: 'center', width: '100%', aspectRatio: 1 },
  badgeEtiquetaNivel: { position: 'absolute', bottom: -8, backgroundColor: 'white', borderWidth: 1.5, borderColor: '#333', paddingHorizontal: 8, paddingVertical: 1, borderRadius: 10 },
  badgeTxtEtiqueta: { fontSize: 10, fontWeight: 'bold', color: '#333' },
  badgeTrilhoProgresso: { width: '85%', height: 5, backgroundColor: '#e0e0e0', borderRadius: 3, marginTop: 12 },
  badgeBarraProgresso: { height: '100%', borderRadius: 3 },
  badgeFracao: { fontSize: 9, color: 'gray', marginTop: 4, fontWeight: 'bold' }
});