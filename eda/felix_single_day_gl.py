import marimo

__generated_with = "0.11.13"
app = marimo.App()


@app.cell
def _():
    import pandas as pd
    import numpy as np
    import os
    import seaborn as sns
    import matplotlib as plt
    import marimo as mo
    return mo, np, os, pd, plt, sns


@app.cell(hide_code=True)
def _(mo):
    mo.md(
        r"""
        #### my guess of what the issue is currently the food can't be matched with the libre GL?
        perhaps i can approximate with dexcom readings of the food and \
        guess on the relative scale of the participants in that dataset and approximate that the same food in this dataset(cgmarcos) \
        has the same relative change in glucose given features of the participant (particant_weight_cgm == particant_weight_big_ideas, etc.))
        """
    )
    return


@app.cell
def _():
    # path of  where the original data is to find a distinct dummy variable
    # for pre dia , dia, and non
    # C:\Users\najer\OneDrive - UC San Diego\winter_2025\final_project_data\data\cgmacros-a-scientific-dataset-for-personalized-nutrition-and-diet-monitoring-1.0.0
    return


@app.cell
def _(pd):
    dexcom_equivalent = pd.read_csv("cleaned_data/CGMacros-001.csv")
    return (dexcom_equivalent,)


@app.cell
def _(dexcom_equivalent):
    dexcom_equivalent
    return


@app.cell
def _(os):
    os.listdir()
    return


@app.cell
def _(dexcom_equivalent):
    dexcom_equivalent.head()
    return


@app.cell
def _():
    # (dexcom_equivalent["Timestamp"][0]).month
    # i think the script is currently missing dropping the 11th day and making timestampe to_datetime?
    return


@app.cell
def _(dexcom_equivalent):
    (dexcom_equivalent["Libre GL"]).value_counts(dropna=False).sum()
    return


@app.cell
def _(dexcom_equivalent):
    (dexcom_equivalent["Dexcom GL"]).value_counts(dropna=False).sum()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(
        r"""
        #### i think it be fine if we relinquish few hundred points per participant unless we do a prediction of the free space available in the groups
        _____
        """
    )
    return


@app.cell
def _():
    # magic command not supported in marimo; please file an issue to add support
    # %pwd
    return


@app.cell
def _(os):
    os.listdir()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(
        r"""
        #### we can make groups of  A1c (this is how pre dia, dia, non is declrared)




        | normal      | Prediabetes     | diabetes |
        | ------------- | ------------- | ------- |
        | below 5.7% | : 5.7% to 6.4% | Diabetes: 6.5% or above | 
        | *units in A1c*
        """
    )
    return


@app.cell
def _(pd):
    filtering_participants = pd.read_csv("cleaned_data/bio.csv")
    return (filtering_participants,)


@app.cell
def _(filtering_participants):
    filtering_participants.head()
    return


@app.cell
def _(filtering_participants):
    filtering_participants["A1c PDL (Lab)"]
    return


@app.cell
def _(np):
    def bin_a1c(df):
        df['Normal'] = np.where(df['A1c PDL (Lab)'] < 5.7, 1, 0)
        df['Prediabetes'] = np.where((df['A1c PDL (Lab)'] >= 5.7) & (df['A1c PDL (Lab)'] < 6.5), 1, 0)
        df['Diabetes'] = np.where(df['A1c PDL (Lab)'] >= 6.5, 1, 0)
        return df
    return (bin_a1c,)


@app.cell
def _(bin_a1c, filtering_participants):
    participants_group = bin_a1c(filtering_participants)
    participants_group
    return (participants_group,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""#### im using dummy variables since we'll eventually need to use decision trees when the quiz is implemented""")
    return


@app.cell
def _():
    # participants_group.to_csv("bio_mutated.csv")
    return


@app.cell
def _(os):
    os.listdir()
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""_______""")
    return


@app.cell
def _(pd):
    pd.read_csv("data/CGMacros/CGMacros-001/CGMacros-001.csv")
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""### Missing files: [24, 25, 37, 40]""")
    return


@app.cell
def _(os):
    def find_missing_files(directory):
        missing_files = []
        for i in range(1, 50):
            filename = f"CGMacros-{i:03d}.csv"
            filepath = os.path.join(directory, f"CGMacros-{i:03d}", filename)
            if not os.path.exists(filepath):
                missing_files.append(i)
        return missing_files

    directory = "data/CGMacros"
    missing_files = find_missing_files(directory)
    if missing_files:
        print(f"Missing files: {missing_files}")
    else:
        print("All files are present")
    return directory, find_missing_files, missing_files


@app.cell
def _(pd):
    _excluded_participants = [24, 25, 37, 40]
    _filenames = [f'data/CGMacros/CGMacros-{i:03d}/CGMacros-{i:03d}.csv' for i in range(1, 50) if i not in _excluded_participants]
    dataframes = [pd.read_csv(filename) for filename in _filenames]
    return (dataframes,)


@app.cell
def _(dataframes):
    dataframes[0]
    return


@app.cell
def _():
    def check_missing_values(dataframes):
        columns_to_check = ['Calories', 'Carbs', 'Protein', 'Fat', 'Fiber']
        valid_dataframes = []
        for i, df in enumerate(dataframes):
            for column in columns_to_check:
                if df[column].isna().sum() != len(df):
                    valid_dataframes.append(i)
                    break
        return valid_dataframes
    return (check_missing_values,)


@app.cell
def _(check_missing_values, dataframes):
    check_missing_values(dataframes) # find the quantity of data actually present in these dataframes i.e. its 2 meals why bother
    return


@app.cell
def _():
    def check_missing_values_1(dataframes):
        columns_to_check = ['Calories', 'Carbs', 'Protein', 'Fat', 'Fiber']
        valid_dataframes = {}
        for i, df in enumerate(dataframes):
            missing_values = {column: df[column].isna().sum() for column in columns_to_check}
            valid_dataframes[i] = missing_values
        return valid_dataframes
    return (check_missing_values_1,)


@app.cell
def _(check_missing_values_1, dataframes):
    check_missing_values_1(dataframes)
    return


@app.cell
def _():
    # only participant 6 might even have data directly inputted
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(
        r"""
        ___
        #### im going to conclusively use the big ideas dataset to approximate ?!?!?!
        #### maybe use image recognition to at least find the food?!?!?
        """
    )
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(
        r"""
        ## cant use dexcom at all cant use marcos either only have jpgs for (maybe use the xgboost model the paper)
        ## image recognition and calories
        """
    )
    return


@app.cell
def _(os):
    os.listdir()
    return


@app.cell
def _(pd):
    _excluded_participants = [24, 25, 37, 40]
    _filenames = [f'cleaned_data/CGMacros-{i:03d}.csv' for i in range(1, 50) if i not in _excluded_participants]
    dataframes_1 = [pd.read_csv(filename) for filename in _filenames]
    return (dataframes_1,)


@app.cell
def _(pd):
    participant_groups = pd.read_csv("data/CGMacros/bio_mutated.csv")
    return (participant_groups,)


@app.cell
def _(participant_groups):
    participant_groups
    return


@app.cell
def _(mo):
    mo.md("""cleaned_data removed bad participants [24, 25, 37, 40] already""")
    return


@app.cell
def _():
    return


@app.cell
def _():
    return


@app.cell
def _(participant_groups):
    diabetes_idx = participant_groups[participant_groups['Diabetes'] == 1].index.tolist()


    pre_diabetes_idx = participant_groups[participant_groups['Prediabetes'] == 1].index.tolist()


    non_diabetes_idx = participant_groups[participant_groups['Normal'] == 1].index.tolist()
    return diabetes_idx, non_diabetes_idx, pre_diabetes_idx


@app.cell
def _(diabetes_idx, non_diabetes_idx, participant_groups, pre_diabetes_idx):
    diabetes_pid = participant_groups[participant_groups['Diabetes'] == 1].loc[diabetes_idx]
    non_diabetes_pid = participant_groups[participant_groups['Normal'] == 1].loc[non_diabetes_idx]
    pre_diabetes_pid = participant_groups[participant_groups['Prediabetes'] == 1].loc[pre_diabetes_idx]
    return diabetes_pid, non_diabetes_pid, pre_diabetes_pid


@app.cell
def _(non_diabetes_pid):
    non_diabetes_pid["PID"] # 1
    return


@app.cell
def _(pre_diabetes_pid):
    pre_diabetes_pid["PID"] # 7
    return


@app.cell
def _(diabetes_pid):
    diabetes_pid["PID"]# 3
    return


@app.cell
def _(dexcom_equivalent):
    participant_1 = dexcom_equivalent
    return (participant_1,)


@app.cell
def _(participant_1):
    temp_part_1 = participant_1.reset_index()
    return (temp_part_1,)


@app.cell
def _():
    # sns.lineplot(x = "Timestamp",y="Libre GL",data = temp_part_1)
    return


@app.cell
def _(pd):
    temp_part_3 = pd.read_csv("cleaned_data/CGMacros-003.csv").reset_index()
    temp_part_8 = pd.read_csv("cleaned_data/CGMacros-008.csv").reset_index()
    return temp_part_3, temp_part_8


@app.cell
def _(temp_part_3):
    temp_part_3
    return


@app.cell
def _():
    # sns.lineplot(x = "Timestamp",y="Libre GL",data = temp_part_3)
    return


@app.cell
def _(temp_part_8):
    temp_part_8
    return


@app.cell
def _():
    # sns.lineplot(x = "Timestamp",y="Libre GL",data = temp_part_8)
    return


@app.cell
def _(temp_part_1):
    temp_part_1[["Timestamp","Libre GL"]].iloc[:1000]
    return


@app.cell
def _(temp_part_3):
    temp_part_3[["Timestamp","Libre GL"]].iloc[:1000]
    return


@app.cell
def _(np, temp_part_8):
    np.unique(temp_part_8[["Timestamp","Libre GL"]].iloc[:1000])
    return


@app.cell
def _(indices):
    indices["Normal"]
    return


@app.cell
def _(missing_files, np):
    np.array(missing_files)
    return


@app.cell
def _(indices, np):
    remove_indices = [23, 24, 36, 39]
    for _key, _value in list(indices.items()):
        indices[_key] = np.array([x for x in _value if x not in remove_indices])
    return (remove_indices,)


@app.cell
def _(dataframes_1, indices):
    dataframes_normal = [dataframes_1[i] for i in indices['Normal']]
    dataframes_prediabetes = [dataframes_1[i] for i in indices['Prediabetes']]
    dataframes_diabetes = [dataframes_1[i] for i in indices['Diabetes']]
    return dataframes_diabetes, dataframes_normal, dataframes_prediabetes


@app.cell
def _():
    return


@app.cell
def _():
    return


@app.cell
def _(dataframes_normal):
    dataframes_normal[0]
    return


@app.cell
def _(dataframes_normal):
    (dataframes_normal)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(
        r"""
        ___
        TODO normalize across the groups for now graph absolute GL across the groups of dataframes
        """
    )
    return


@app.cell
def _(dataframes_diabetes, dataframes_normal, dataframes_prediabetes, pd):
    normal_gl_df = pd.concat([df['Libre GL'] for df in dataframes_normal], axis=1)
    pre_gl_df = pd.concat([df['Libre GL'] for df in dataframes_prediabetes], axis=1)
    dia_gl_df = pd.concat([df['Libre GL'] for df in dataframes_diabetes], axis=1)
    return dia_gl_df, normal_gl_df, pre_gl_df


@app.cell
def _(dia_gl_df):
    dia_gl_df
    return


@app.cell
def _():
    return


@app.cell
def _():
    return


@app.cell
def _():
    return


@app.cell
def _():
    return


@app.cell
def _(normal_gl_df, pd):
    populated_normal = normal_gl_df.dropna(how='any')

    # calculate the average of the row
    temp_df_0 = (populated_normal.sum(axis=1)) / len(populated_normal.columns)

    temp_df_0 = pd.DataFrame(temp_df_0)
    return populated_normal, temp_df_0


@app.cell
def _(temp_df_0):
    temp_df_0
    return


@app.cell
def _(pd, pre_gl_df):
    populated_pre = pre_gl_df.dropna(how='any')

    # calculate the average of the row
    temp_df_1 = (populated_pre.sum(axis=1)) / len(populated_pre.columns)

    temp_df_1 = pd.DataFrame(temp_df_1)
    return populated_pre, temp_df_1


@app.cell
def _(temp_df_1):
    temp_df_1
    return


@app.cell
def _(dia_gl_df, pd):
    populated_dia = dia_gl_df.dropna(how='any')

    # calculate the average of the row
    temp_df_2 = (populated_dia.sum(axis=1)) / len(populated_dia.columns)

    temp_df_2 = pd.DataFrame(temp_df_2)
    return populated_dia, temp_df_2


@app.cell
def _(pd, temp_df_0, temp_df_1, temp_df_2):
    final_df = pd.concat([temp_df_0, temp_df_2,temp_df_1], axis=1)
    final_df.columns = ["Normal", "Diabetic","Pre-Diabetic"
                       ]
    final_df
    return (final_df,)


@app.cell
def _(dataframes_1, final_df, pd):
    time_truncated = pd.DataFrame(dataframes_1[0]['Timestamp'].values[:len(final_df)])
    return (time_truncated,)


@app.cell
def _(final_df, time_truncated):
    final_df["Timestamp"] = time_truncated
    final_df
    return


@app.cell
def _(final_df):
    final_df.to_csv("absolute_gl_values_grouped_h1Ac.csv")
    return


@app.cell
def _():
    # df_melted = final_df.melt(id_vars='Timestamp', 
    #                            value_vars=['Normal', 'Pre-Diabetic', 'Diabetic'],
    #                            var_name='Condition', 
    #                            value_name='GL')

    # Create the line plot using Seaborn
    # sns.lineplot(data=df_melted, x='Timestamp', y='GL', hue='Condition')
    return


@app.cell
def _():
    # df_melt = final_df.melt(id_vars='Timestamp', value_vars=['Normal', 'Diabetic', 'Pre-Diabetic'])
    # # df_melt
    # sns.lineplot(x='Timestamp', y='value', hue='variable', data=df_melt)
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
