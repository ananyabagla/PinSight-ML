import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Generate 100 5-minute intervals
timestamps = [datetime(2027, 5, 10, 12, 0) + timedelta(minutes=5*i) for i in range(100)]

# Simulate ML Recommendation Model metrics
data = {
    "timestamp": timestamps,
    "ctr_percentage": np.random.normal(3.2, 0.4, 100),         # Click-through rate
    "save_rate_percentage": np.random.normal(1.5, 0.2, 100),   # Repin/Save rate
    "avg_dwell_time_sec": np.random.normal(45.0, 12.0, 100),   # Time spent on pin
    "relevance_score": np.random.uniform(0.75, 0.98, 100),     # Embedding similarity score
}

df = pd.DataFrame(data)

# Introduce an anomaly (Simulating a bad model deployment at 14:00)
anomaly_idx = 24  # 14:00
df.loc[anomaly_idx:anomaly_idx+10, 'ctr_percentage'] *= 0.5
df.loc[anomaly_idx:anomaly_idx+10, 'save_rate_percentage'] *= 0.3
df.loc[anomaly_idx:anomaly_idx+10, 'relevance_score'] -= 0.15

df.to_csv("pinterest_model_metrics.csv", index=False)
print("Created pinterest_model_metrics.csv")