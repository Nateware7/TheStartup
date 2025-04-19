let userConfig = undefined
try {
  // try to import ESM first
  userConfig = await import('./v0-user-next.config.mjs')
} catch (e) {
  try {
    // fallback to CJS import
    userConfig = await import("./v0-user-next.config");
  } catch (innerError) {
    // ignore error
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Disabling all experimental features to avoid compatibility issues
    webpackBuildWorker: false,
    parallelServerBuildTraces: false,
    parallelServerCompiles: false,
  },
  webpack: (config, { isServer }) => {
    // Configure webpack to properly handle CSS files with PostCSS
    config.optimization.minimize = false; // Disable minification temporarily
    
    // Make sure PostCSS plugins are applied correctly
    const rules = config.module.rules;
    const cssRules = rules.find(rule => 
      rule.oneOf && Array.isArray(rule.oneOf) && 
      rule.oneOf.some(oneof => 
        oneof.test && oneof.test.toString().includes('css')
      )
    );
    
    if (cssRules && cssRules.oneOf) {
      cssRules.oneOf.forEach(rule => {
        if (rule.test && rule.test.toString().includes('css')) {
          // Ensure rule.use is defined and includes postcss-loader
          if (rule.use && Array.isArray(rule.use)) {
            rule.use.forEach(loader => {
              if (loader.loader && loader.loader.includes('postcss-loader')) {
                // Make sure postcss-loader is configured correctly
                if (!loader.options) loader.options = {};
                if (!loader.options.postcssOptions) loader.options.postcssOptions = {};
              }
            });
          }
        }
      });
    }
    
    return config;
  },
}

if (userConfig) {
  // ESM imports will have a "default" property
  const config = userConfig.default || userConfig

  for (const key in config) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...config[key],
      }
    } else {
      nextConfig[key] = config[key]
    }
  }
}

export default nextConfig
