import torch
import torch.nn as nn
import numpy as np
from sklearn import datasets
import matplotlib.pyplot as plt
# 0) Prepare data
x_numpy, y_numpy = datasets.make_regression(n_samples=100, n_features=1, noise=20, random_state=1)
x = torch.from_numpy(x_numpy.astype(np.float32))
y = torch.from_numpy(y_numpy.astype(np.float32))
y = y.view(y.shape[0], 1)
n_samples, n_features = x.shape
# 1) Design model (input, output size, forward pass)
input_size = n_features
output_size = 1
model = nn.Linear(input_size, output_size)

# 2) Construct loss and optimizer
criterion = nn.MSELoss()
learning_rate = 0.01
optimizer = torch.optim.SGD(model.parameters(), lr=learning_rate)

# 3) Training loop
#   - forward pass: compute prediction
#   - backward pass: gradients
#   - update weights
num_epochs = 100
for epoch in range(num_epochs):
    # Forward pass
    y_predicted = model(x)
    loss = criterion(y_predicted, y)
    # Backward pass
    loss.backward()
    # Update
    optimizer.step()
    optimizer.zero_grad()
    if (epoch+1) % 10 == 0:
        print(f'epoch: {epoch+1}, loss = {loss.item():.4f}')

# Plot
predicted = model(x).detach().numpy()
plt.plot(x_numpy, y_numpy, 'ro')
plt.plot(x_numpy, predicted, 'b')
plt.show()
