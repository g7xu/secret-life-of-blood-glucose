# this file will take data in the "data" folder and clean it up
# the resulting data will be stored in the "cleaned_data" folder and uploaded to google drive
import os

import numpy as np
import pandas as pd

NON_DIABETIC_CANIDATES = [1, 6, 31, 48, 34]
PRE_DIABETIC_CANIDATES = [8, 29, 26, 9, 10]
DIABETIC_CANIDATES = [12, 14, 49, 42, 30]

# helper functions
def identify_diabetes(A1c):
    if A1c < 5.7:
        return "Non-diabetic"
    elif A1c >= 5.7 and A1c < 6.5:
        return "Pre-diabetic"
    else:
        return "Diabetic"
    
def resample_glucose(group):
    temp =  group.set_index('Timestamp').resample('15T').mean().reset_index()
    
    return temp.dropna(subset=['PID'])



def clean_geo_data(gemographic_data: pd.DataFrame):
    # rename the some of the column name
    gemographic_data.rename(
        columns={"subject": "PID", "Self-identify ": "Self-identifid-Race"},
        inplace=True,
    )

    # aggregre the starting GLU by taking the average of three
    gemographic_data["Starting GLU"] = gemographic_data[
        [
            "#1 Contour Fingerstick GLU",
            " #2 Contour Fingerstick GLU",
            "#3 Contour Fingerstick GLU",
        ]
    ].mean(axis=1)
    gemographic_data.drop(
        [
            "#1 Contour Fingerstick GLU",
            " #2 Contour Fingerstick GLU",
            "#3 Contour Fingerstick GLU",
            "Time (t)",
            "Time (t).1",
            "Time (t).2",
        ],
        axis=1,
        inplace=True,
    )

    # categorize participants based on their A1c level
    gemographic_data["diabetes level"] = gemographic_data["A1c PDL (Lab)"].apply(
        identify_diabetes
    )

    return gemographic_data


def clean_gut_health_data(gut_health_data: pd.DataFrame):
    # rename the some of the column name
    gut_health_data.rename(
        columns={"subject": "PID"},
        inplace=True,
    )

    return gut_health_data


def clean_CGMarcros(folder_path: str):
    CGMacros = []
    for subdir, _, files in os.walk(folder_path):
        for file in files:
            if file.endswith(".csv") and "CGMacros-" in subdir:
                file_path = os.path.join(subdir, file)
                df = pd.read_csv(file_path)
                # df.drop(columns=["Image path"], inplace=True)
                # df contain column 'Unnamed: 0', drop it
                if "Unnamed: 0" in df.columns:
                    df.drop(columns=["Unnamed: 0"], inplace=True)

                # drop Dexcom GL
                if "Dexcom GL" in df.columns:
                    df.drop(columns=["Dexcom GL"], inplace=True)

                # reset the timestamp
                df["Timestamp"] = pd.to_datetime(df["Timestamp"])
                df["Timestamp"] = df["Timestamp"] - df["Timestamp"].min()

                # remove the row in the first 18 hours
                df = df[df["Timestamp"] > pd.Timedelta(hours=15)]

                # reset the timestamp again
                df['Timestamp'] = df['Timestamp'] - df["Timestamp"].min()


                df["Timestamp"] = df["Timestamp"] + pd.Timedelta(days=1)

                
                # row the row if the timestamp go over 10 days
                df = df[df["Timestamp"] < pd.Timedelta(days=10)]

                # set all the words in the meal tyle to lower case
                df["Meal Type"] = (
                    df["Meal Type"].str.lower().str.replace("snack 1", "snack")
                )
                df["Meal Type"] = (
                    df["Meal Type"].str.lower().str.replace("snacks", "snack")
                )

                df.columns = df.columns.str.strip()
                df.name = file

                # creating a new column for the df name indicating the PID of the participant
                df["PID"] = int(file.split("-")[1].split(".")[0])

                CGMacros.append(df)

    CGMacroDF = pd.concat(CGMacros).drop(
        columns=["Sugar", "Intensity", "Steps", "RecordIndex", "Image path"]
    )

    # aggregate the data by taking the average of every 15 mins
    with_meal = CGMacroDF[~CGMacroDF['Meal Type'].isna()]
    without_meal = CGMacroDF[CGMacroDF['Meal Type'].isna()]

    without_meal = without_meal.groupby('PID', group_keys=False).apply(resample_glucose)
    CGMacroDF = pd.concat([without_meal, with_meal]).sort_values(by=['PID', 'Timestamp'])

    # Drop Participants 18
    CGMacroDF = CGMacroDF[CGMacroDF['PID'] != 18]

    return CGMacroDF

def find_metrics(data, meal_data):
    metrics = []

    for index, meal in meal_data.iterrows():
        meal_time = meal['Timestamp']
        baseline_glucose = meal['Libre GL']
        pid = meal['PID']
        
        # filter data
        post_meal_data = data[
            (data['PID'] == pid) &
            (data['Timestamp'] >= meal_time) &
            (data['Timestamp'] <= meal_time + pd.Timedelta(hours=3))
        ]

        # Time to Peak Glucose
        if not post_meal_data.empty:
            peak_glucose_row = post_meal_data.loc[post_meal_data['Libre GL'].idxmax()]
            peak_glucose_time = peak_glucose_row['Timestamp']
            time_to_peak_glucose = peak_glucose_time - meal_time

            # Glucose Excursion
            peak_glucose = peak_glucose_row['Libre GL']
            glucose_excursion = peak_glucose - baseline_glucose
            glucose_excursion_time = peak_glucose_time

            # Glucose Recovery Time
            recovery_data = post_meal_data[(post_meal_data['Timestamp'] >= peak_glucose_time) & (post_meal_data['Libre GL'] <= baseline_glucose)]

        

            if not recovery_data.empty:
                recovery_time = recovery_data.sort_values('Timestamp').iloc[0]['Timestamp']
                glucose_recovery_time = recovery_time - meal_time
            else:
                recovery_time = post_meal_data['Timestamp'].max()
                glucose_recovery_time = recovery_time - meal_time

            metrics.append({
                'PID': pid,
                'Meal Time': meal_time,
                'Meal Type': meal['Meal Type'],
                'Glucose Level at Meal Time': baseline_glucose,
                'Time to Peak Glucose': time_to_peak_glucose,
                'Glucose Excursion': glucose_excursion,
                'Glucose Excursion Time': glucose_excursion_time,
                'Glucose Recovery Time': glucose_recovery_time
            })

    return pd.DataFrame(metrics)

if __name__ == "__main__":
    # read data
    gemographic_data = pd.read_csv("data/CGMacros/bio.csv")
    gut_health_data = pd.read_csv("data/CGMacros/gut_health_test.csv")

    # cleaning the data
    cleaned_geo_data = clean_geo_data(gemographic_data)
    cleaned_gut_health_data = clean_gut_health_data(gut_health_data)
    cleaned_CGMarcros = clean_CGMarcros("data/CGMacros")

    if not os.path.exists("cleaned_data"):
        os.makedirs("cleaned_data")

    cleaned_geo_data.to_csv("cleaned_data/bio.csv", index=False)
    cleaned_gut_health_data.to_csv("cleaned_data/gut_health.csv", index=False)

    cleaned_CGMarcros.to_csv("cleaned_data/CGMacros.csv", index=False)

    # save the meal data
    meal_data = cleaned_CGMarcros[cleaned_CGMarcros["Meal Type"].notnull()]
    meal_data["Timestamp"] = meal_data["Timestamp"].astype(str)

    # adding diabetes level to the meal data
    meal_data = meal_data.merge(
        cleaned_geo_data[["PID", "diabetes level"]], on="PID", how="left"
    )

    # filter out the participants who are not in the list
    meal_data = meal_data[
        meal_data["PID"].isin(NON_DIABETIC_CANIDATES + PRE_DIABETIC_CANIDATES + DIABETIC_CANIDATES)
    ]

    cleaned_CGMarcros = cleaned_CGMarcros[
        cleaned_CGMarcros["PID"].isin(NON_DIABETIC_CANIDATES + PRE_DIABETIC_CANIDATES + DIABETIC_CANIDATES)
    ]

    # find metrics
    metrics = find_metrics(cleaned_CGMarcros, meal_data)
    

    # save the meal data in json file
    meal_data.to_json("assets/vis_data/meal_data.json", orient="records", indent=4)

    cleaned_CGMarcros['Timestamp'] = cleaned_CGMarcros['Timestamp'].astype(str)


    cleaned_CGMarcros.to_json("assets/vis_data/CGMacros.json", orient="records", indent=4)  

    cleaned_geo_data.to_json("assets/vis_data/bio.json", orient="records", indent=4)

    metrics.to_json("assets/vis_data/metrics.json", orient="records", indent=4)

    print("Data cleaning is done")

