import pandas as pd
import numpy as np
import itertools
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import TimeSeriesSplit
import warnings
warnings.filterwarnings("ignore")


df = pd.read_csv(
    r'..\model\expenses2.csv',
    usecols=['date', 'category', 'expense_amt_categorized']
)

# Parse the 'date' column (format is YYYY-MM-DD)
df['date'] = pd.to_datetime(df['date'], format='%Y-%m-%d')

df = df.groupby(['date', 'category'], as_index=False)['expense_amt_categorized'].sum()

true_last_date = df['date'].max()


def find_best_arima_order(ts):
    """
    Find the best ARIMA parameters using grid search and AIC
    
    Args:
    ts (pd.Series): Time series data
    
    Returns:
    tuple: Best (p,d,q) order
    """
    # Define parameter ranges
    p = range(0, 3)  # AR terms
    d = range(0, 2)  # Differencing
    q = range(0, 3)  # MA terms
    
    # Generate all possible parameter combinations
    pdq = list(itertools.product(p, d, q))
    
    # Find best model based on lowest AIC
    best_aic = np.inf
    best_order = None
    
    
    for param in pdq:
        try:
            model = ARIMA(ts, order=param)
            results = model.fit()
            
            if results.aic < best_aic:
                best_aic = results.aic
                best_order = param
        except Exception as e:
            print(f"Error fitting ARIMA{param}: {e}")
            continue
    
    return best_order

def rolling_forecast_validation(ts, initial_train_size=90, horizon=30):
    """Performs rolling forecast validation on time series data."""
    tscv = TimeSeriesSplit(n_splits=5)
    errors = []
    
    print(f"Starting rolling forecast validation. Total series length: {len(ts)}")
    
    for fold, (train_idx, test_idx) in enumerate(tscv.split(ts), 1):
        train, test = ts.iloc[train_idx], ts.iloc[test_idx]
        
        
        try:
            # Find best order for each fold
            best_order = find_best_arima_order(train)
            
            # Fit ARIMA model
            model = ARIMA(train, order=best_order).fit()
            
            # Forecast
            forecast = model.forecast(steps=len(test))
            
            # Calculate RMSE
            rmse = np.sqrt(mean_squared_error(test, forecast))
            errors.append(rmse)
            
        except Exception as e:
            print(f"ARIMA failed on validation fold {fold}. Reason: {e}")
    
    avg_error = np.mean(errors) if errors else None
    return avg_error

def perform_category_forecasting(df):
    """
    Perform forecasting for each category
    
    Args:
    df (pd.DataFrame): Input dataframe
    
    Returns:
    pd.DataFrame: Forecasted expenses
    """
    # # Create a directory to save models if it doesn't exist
    # os.makedirs('saved_arima_models', exist_ok=True)
    
    # Validate input DataFrame
    if df is None or df.empty:
        print("Error: Input DataFrame is None or empty")
        return None
    
    # Find the last available date
    true_last_date = df['date'].max()
    
    # Get unique categories
    all_categories = df["category"].unique()
    
    # List to store forecasts
    forecasts_list = []
    
    # Dictionary to store category errors and models
    category_errors = {}
    category_models = {}
    
    for cat in all_categories:
        # Filter and prepare data for the category
        df_cat = df[df["category"] == cat].copy()
        
        df_cat.set_index("date", inplace=True)
        df_cat = df_cat.resample("D").sum().fillna(0)  # Ensure daily data
        
        # Ensure time series is not empty
        if df_cat.empty:
            print(f"Warning: No data for category {cat}")
            continue
        
        ts = df_cat["expense_amt_categorized"]
        
        try:
            # Perform rolling forecast validation
            rmse_score = rolling_forecast_validation(ts)
            category_errors[cat] = rmse_score
            
            # Find best ARIMA order
            best_order = find_best_arima_order(ts)
            
            # Fit ARIMA model
            model = ARIMA(ts, order=best_order).fit()
            
            # Save the model
            # model_filename = f'saved_arima_models/{cat}_arima_model.pkl'
            # joblib.dump(model, model_filename)
            # print(f"Saved ARIMA model for {cat} to {model_filename}")
            
            # Store model details
            # category_models[cat] = {
            #     'model_path': model_filename,
            #     'order': best_order,
            #     'rmse': rmse_score
            # }
            
            # Generate future dates
            future_dates = pd.date_range(start=true_last_date + pd.Timedelta(days=1), periods=30, freq='D')
            
            # Forecast
            forecast = model.forecast(steps=30)
            
            # Prepare forecast dataframe
            forecast_df = pd.DataFrame({
                'date': future_dates,
                'predicted_expense': forecast,
                'category': cat
            })
            
            # Cap predictions based on past maximum spending per category
            max_past_spending = ts.max()
            forecast_df["predicted_expense"] = np.minimum(forecast_df["predicted_expense"], max_past_spending)
            
            forecasts_list.append(forecast_df)
        
        except Exception as e:
            print(f"ARIMA failed for category {cat}. Detailed Error: {e}")
            import traceback
            traceback.print_exc()

    # Save category models metadata
    # joblib.dump(category_models, 'saved_arima_models/category_models_metadata.pkl')
    
    if forecasts_list:
        final_forecast = pd.concat(forecasts_list, ignore_index=True)
        final_forecast.sort_values(by=['date', 'category'], inplace=True)
        
        print("\n--- Final Forecast ---")
        print("Next 30 Days Predicted Expenses by Category:")
        print(final_forecast)
        
        return final_forecast
    else:
        print("No forecasts were generated.")
        return None

def spending_analyser(user_budget, username):
    final_forecast = perform_category_forecasting(df)
    final_forecast.to_csv('final_forecast.csv', index=False)
    category_sums = final_forecast.groupby("category")["predicted_expense"].sum()
    category_sums_sorted = category_sums.sort_values(ascending=False)

    print("\n📊 Category-wise Total Predicted Expense for Next 30 Days (Descending Order):")
    print(category_sums_sorted)

    category_sums = final_forecast.groupby("category")["predicted_expense"].sum()
    print("Original Category Sums (Predicted):")
    print(category_sums)

    total_predicted = category_sums.sum()

    scale_factor = user_budget / total_predicted

    scaled_category_sums = category_sums * scale_factor

    rounded_category_sums = scaled_category_sums.apply(lambda x: round(x / 10) * 10)

    difference = user_budget - rounded_category_sums.sum()
    print(f"\nBudget difference after initial rounding: {difference}")

    if difference != 0:
        remainders = scaled_category_sums - rounded_category_sums
        
        increments = int(round(abs(difference) / 10))
        
        if difference > 0:
            sorted_cats = remainders.sort_values(ascending=False).index
            for cat in sorted_cats:
                if increments <= 0:
                    break
                rounded_category_sums[cat] += 10
                increments -= 1
        elif difference < 0:
            sorted_cats = remainders.sort_values(ascending=True).index
            for cat in sorted_cats:
                if increments <= 0:
                    break
                if rounded_category_sums[cat] >= 10:
                    rounded_category_sums[cat] -= 10
                increments -= 1

    print("\nAdjusted Category-wise Budget Allocation (Rounded to Tens):")
    print(rounded_category_sums)

    print("\nTotal Allocated Budget:", rounded_category_sums.sum())
    rounded_cat_sum = rounded_category_sums.sum()
    
    return rounded_category_sums,rounded_cat_sum



