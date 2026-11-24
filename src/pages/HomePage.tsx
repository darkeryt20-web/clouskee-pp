import {MotionConfig} from 'motion/react';
import {HeroSection} from '../components/HeroSection';
import {HomeSections} from '../components/HomeSections';

export function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <HeroSection />
      <HomeSections />
    </MotionConfig>
  );
}
