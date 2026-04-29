// Dashboard performance testing utility

export class PerformanceTest {
  static measurePageLoad(pageName: string) {
    const startTime = performance.now();
    
    return {
      start: startTime,
      end: (endTime?: number) => {
        const duration = (endTime || performance.now()) - startTime;
        console.log(`📊 ${pageName} load time: ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  }

  static measureApiCall(apiName: string) {
    const start = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - start;
        console.log(`🌐 ${apiName} API time: ${duration.toFixed(2)}ms`);
        
        if (duration > 1000) {
          console.warn(`⚠️ Slow API: ${apiName} took ${duration.toFixed(2)}ms`);
        }
        
        return duration;
      }
    };
  }

  static async testDashboardLoad() {
    console.log('🚀 Starting dashboard performance test...');
    
    const pageLoad = this.measurePageLoad('Dashboard');
    
    // Simulate API calls timing
    const profileTime = this.measureApiCall('Profile');
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API call
    profileTime.end();
    
    const notificationsTime = this.measureApiCall('Notifications');
    await new Promise(resolve => setTimeout(resolve, 150)); // Simulate API call
    notificationsTime.end();
    
    const usersTime = this.measureApiCall('Users');
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
    usersTime.end();
    
    pageLoad.end();
    
    console.log('✅ Dashboard performance test completed!');
  }
}

// Auto-run in development
if (process.env.NODE_ENV === 'development') {
  // Uncomment to test: PerformanceTest.testDashboardLoad();
}
