import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

// L'icône que nous venons de générer
const splashIcon = require('../../assets/images/splash-icon.png');

type AnimatedSplashScreenProps = {
  onAnimationFinished: () => void;
  isAppReady: boolean;
};

export default function AnimatedSplashScreen({ onAnimationFinished, isAppReady }: AnimatedSplashScreenProps) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  useEffect(() => {
    // Une fois l'application prête, on lance l'animation de sortie du splash screen
    if (isAppReady) {
      // Séquence d'animation : petit rebond (scale) puis disparition en fondu
      scale.value = withSequence(
        withTiming(1.1, { duration: 300, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(0.8, { duration: 400, easing: Easing.in(Easing.ease) })
      );

      opacity.value = withDelay(
        200, 
        withTiming(0, { duration: 500 }, () => {
          runOnJS(setIsAnimationComplete)(true);
        })
      );
    }
  }, [isAppReady]);

  useEffect(() => {
    if (isAnimationComplete) {
      onAnimationFinished();
    }
  }, [isAnimationComplete, onAnimationFinished]);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedContainerStyle, { pointerEvents: isAnimationComplete ? 'none' : 'auto' }]}>
      <View style={styles.background}>
        <Animated.Image
          source={splashIcon}
          style={[styles.logo, animatedLogoStyle]}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000', // Fond sombre pour la vibe tech
    zIndex: 999, // S'assure que le splash screen est au dessus de tout
  },
  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111', 
  },
  logo: {
    width: 250,
    height: 250,
  },
});
